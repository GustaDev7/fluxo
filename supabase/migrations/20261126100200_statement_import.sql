alter table fluxo_private.bank_connections
  alter column provider_item drop not null,
  alter column intent_id drop not null,
  add column statement_key text,
  add column statement_as_of date,
  add unique (owner_id, statement_key),
  add check ((statement_key is null and intent_id is not null and provider_item is not null)
    or (statement_key is not null and intent_id is null and provider_item is null));

create or replace function public.fluxo_bank_overview(target_workspace uuid, month_start date, tx_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  workspace_kind text;
begin
  select kind into workspace_kind from fluxo_private.members where workspace_id = target_workspace and user_id = actor;
  if not found then raise insufficient_privilege; end if;
  if month_start is null or extract(day from month_start) <> 1 or tx_offset is null or tx_offset < 0 then
    raise exception 'Invalid period' using errcode = '22023';
  end if;
  return (
    with visible as (
      select * from fluxo_private.bank_connections
      where (workspace_kind = 'personal' and owner_id = actor)
        or (workspace_kind = 'couple' and shared_workspace_id = target_workspace and status <> 'disconnecting'
          and exists (select 1 from fluxo_private.members m where m.workspace_id = target_workspace and m.user_id = owner_id))
    ), monthly as (
      select t.*, a.name as account_name from fluxo_private.bank_transactions t
      join visible c on c.id = t.connection_id and c.status <> 'disconnecting'
      join fluxo_private.bank_accounts a on a.connection_id = t.connection_id and a.provider_id = t.account_id
      where t.posted_on >= month_start and t.posted_on < month_start + interval '1 month'
    )
    select jsonb_build_object(
      'connections', coalesce((select jsonb_agg(jsonb_build_object(
        'id', c.id, 'institution', c.institution, 'owned', c.owner_id = actor,
        'source', case when c.statement_key is null then 'pluggy' else 'ofx' end,
        'shared', c.shared_workspace_id is not null, 'status', c.status, 'syncedAt', c.synced_at,
        'accounts', coalesce((select jsonb_agg(jsonb_build_object(
          'name', a.name, 'kind', a.kind, 'currency', a.currency, 'balance', a.balance
        ) order by a.name) from fluxo_private.bank_accounts a where a.connection_id = c.id and c.status <> 'disconnecting'), '[]'::jsonb)
      ) order by c.institution, c.id) from visible c), '[]'::jsonb),
      'count', (select count(*) from monthly),
      'transactions', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x.provider_id, 'connectionId', x.connection_id, 'description', x.description,
        'date', x.posted_on, 'amount', x.amount, 'currency', x.currency,
        'direction', x.direction, 'account', x.account_name
      ) order by x.posted_on desc, x.provider_id, x.connection_id) from (
        select * from monthly order by posted_on desc, provider_id, connection_id limit 50 offset tx_offset
      ) x), '[]'::jsonb)
    )
  );
end;
$$;

create function public.fluxo_import_statement(
  statement_key text, institution_name text, account_name text, account_kind text,
  currency_code text, closing_balance numeric, balance_date date, entries jsonb
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  target uuid;
  account uuid;
  imported integer;
begin
  if actor is null then raise insufficient_privilege; end if;
  if statement_key is null or statement_key !~ '^[a-f0-9]{64}$'
    or length(trim(institution_name)) not between 1 and 80
    or length(trim(account_name)) not between 1 and 80
    or jsonb_typeof(entries) is distinct from 'array'
    or jsonb_array_length(entries) not between 1 and 2500
    or pg_column_size(entries) > 2097152 then
    raise exception 'Extrato inválido ou acima do limite de 2.500 lançamentos.' using errcode = '22023';
  end if;
  perform 1 from auth.users where id = actor for no key update;
  insert into fluxo_private.bank_connections(owner_id, institution, statement_key, status, synced_at, statement_as_of)
    values (actor, trim(institution_name), statement_key, 'ready', now(), balance_date)
    on conflict on constraint bank_connections_owner_id_statement_key_key do update
      set synced_at = now(),
        statement_as_of = greatest(bank_connections.statement_as_of, excluded.statement_as_of)
    returning id into target;

  account := md5(target::text)::uuid;
  insert into fluxo_private.bank_accounts(connection_id, provider_id, name, kind, currency, balance)
    values (target, account, trim(account_name), account_kind, currency_code, closing_balance)
    on conflict (connection_id, provider_id) do update set balance = excluded.balance
    where closing_balance is not null and balance_date =
      (select statement_as_of from fluxo_private.bank_connections where id = target);

  insert into fluxo_private.bank_transactions(connection_id, provider_id, account_id, description, posted_on, amount, currency, direction)
    select target, md5(t.fit_id)::uuid, account, t.description, t.posted_on, t.amount, currency_code, t.direction
    from jsonb_to_recordset(entries) as t(fit_id text, description text, posted_on date, amount numeric, direction text)
    where length(t.fit_id) between 1 and 250 and length(t.description) between 1 and 400
    on conflict (connection_id, provider_id) do nothing;
  get diagnostics imported = row_count;
  return imported;
end;
$$;

create function public.fluxo_remove_statement(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from fluxo_private.bank_connections where id = target and owner_id = auth.uid() and statement_key is not null;
  if not found then raise insufficient_privilege; end if;
end;
$$;

revoke all on function public.fluxo_import_statement(text,text,text,text,text,numeric,date,jsonb),
  public.fluxo_remove_statement(uuid) from public, anon, authenticated;
grant execute on function public.fluxo_import_statement(text,text,text,text,text,numeric,date,jsonb),
  public.fluxo_remove_statement(uuid) to authenticated;

create or replace function public.fluxo_bank_command(actor uuid, target uuid, command text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  connection fluxo_private.bank_connections%rowtype;
begin
  select * into connection from fluxo_private.bank_connections where id = target and owner_id = actor and provider_item is not null for update;
  if not found then raise insufficient_privilege; end if;
  case command
    when 'disconnect' then
      update fluxo_private.bank_connections set status = 'disconnecting', shared_workspace_id = null, sync_revision = null
        where id = target;
    when 'remove' then
      if connection.status <> 'disconnecting' then raise insufficient_privilege; end if;
      delete from fluxo_private.bank_connections where id = target;
      delete from fluxo_private.bank_intents where id = connection.intent_id;
    when 'reconnect' then
      if connection.status = 'disconnecting' then raise insufficient_privilege; end if;
    when 'sync' then
      if connection.status = 'disconnecting' then raise insufficient_privilege; end if;
      if connection.sync_started_at > now() - interval '2 minutes' then
        raise exception 'Aguarde dois minutos entre sincronizações.' using errcode = '22023';
      end if;
      update fluxo_private.bank_connections set sync_started_at = now(), sync_revision = gen_random_uuid()
        where id = target returning * into connection;
    else raise exception 'Invalid command' using errcode = '22023';
  end case;
  return jsonb_build_object('item', connection.provider_item, 'revision', connection.sync_revision);
end;
$$;

