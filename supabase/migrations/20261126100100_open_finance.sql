create table fluxo_private.bank_intents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index bank_intents_owner_idx on fluxo_private.bank_intents(owner_id, created_at);

create table fluxo_private.bank_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_item uuid not null unique,
  intent_id uuid not null unique,
  institution text not null,
  shared_workspace_id uuid references fluxo_private.workspaces(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'action_required', 'error', 'disconnecting')),
  synced_at timestamptz,
  sync_started_at timestamptz,
  sync_revision uuid,
  unique (id, owner_id)
);
create index bank_connections_owner_idx on fluxo_private.bank_connections(owner_id);
create index bank_connections_shared_idx on fluxo_private.bank_connections(shared_workspace_id);

create table fluxo_private.bank_accounts (
  connection_id uuid not null references fluxo_private.bank_connections(id) on delete cascade,
  provider_id uuid not null,
  name text not null,
  kind text not null check (kind in ('BANK','CREDIT')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  balance numeric(18,2),
  primary key (connection_id, provider_id)
);

create table fluxo_private.bank_transactions (
  connection_id uuid not null,
  account_id uuid not null,
  provider_id uuid not null,
  description text not null,
  posted_on date not null,
  amount numeric(18,2) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  direction text not null check (direction in ('DEBIT', 'CREDIT')),
  primary key (connection_id, provider_id),
  foreign key (connection_id, account_id) references fluxo_private.bank_accounts(connection_id, provider_id) on delete cascade
);
create index bank_transactions_period_idx on fluxo_private.bank_transactions(connection_id, posted_on desc, provider_id);

alter table fluxo_private.bank_intents enable row level security;
alter table fluxo_private.bank_connections enable row level security;
alter table fluxo_private.bank_accounts enable row level security;
alter table fluxo_private.bank_transactions enable row level security;

create or replace function public.fluxo_leave_couple(target_workspace uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from fluxo_private.workspaces where id = target_workspace and kind = 'couple' for update;
  delete from fluxo_private.members where workspace_id = target_workspace and user_id = auth.uid() and kind = 'couple';
  if not found then raise insufficient_privilege; end if;
  update fluxo_private.bank_connections set shared_workspace_id = null
    where shared_workspace_id = target_workspace and owner_id = auth.uid();
  delete from fluxo_private.invitations where workspace_id = target_workspace;
end;
$$;

create function public.fluxo_share_bank(connection_id uuid, target_workspace uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if target_workspace is not null then
    perform 1 from fluxo_private.workspaces where id = target_workspace for update;
    if not exists (select 1 from fluxo_private.members where user_id = auth.uid()
      and workspace_id = target_workspace and kind = 'couple') then raise insufficient_privilege; end if;
  end if;
  update fluxo_private.bank_connections set shared_workspace_id = target_workspace
    where id = connection_id and owner_id = auth.uid() and status <> 'disconnecting';
  if not found then raise insufficient_privilege; end if;
end;
$$;

create function public.fluxo_bank_overview(target_workspace uuid, month_start date, tx_offset integer default 0) returns jsonb
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

create function public.fluxo_bank_intent(actor uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  intent uuid;
begin
  perform 1 from auth.users where id = actor for no key update;
  if not found then raise insufficient_privilege; end if;
  delete from fluxo_private.bank_intents where owner_id = actor and created_at < now() - interval '1 hour';
  if (select count(*) from fluxo_private.bank_intents where owner_id = actor) >= 8
    or (select count(*) from fluxo_private.bank_connections where owner_id = actor) >= 8 then
    raise exception 'Limite de conexões ou tentativas atingido.' using errcode = '22023';
  end if;
  insert into fluxo_private.bank_intents(owner_id) values (actor) returning id into intent;
  return intent;
end;
$$;

create function public.fluxo_register_bank(actor uuid, item uuid, intent uuid, institution_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  connection uuid;
begin
  perform 1 from auth.users where id = actor for no key update;
  if not found then raise insufficient_privilege; end if;
  select id into connection from fluxo_private.bank_connections
    where owner_id = actor and provider_item = item and intent_id = intent;
  if found then return connection; end if;
  if not exists (select 1 from fluxo_private.bank_intents
    where id = intent and owner_id = actor and created_at > now() - interval '1 hour')
    then raise insufficient_privilege; end if;
  if (select count(*) from fluxo_private.bank_connections where owner_id = actor) >= 8 then
    raise exception 'Limite de conexões atingido.' using errcode = '22023';
  end if;
  insert into fluxo_private.bank_connections(owner_id, provider_item, intent_id, institution)
    values (actor, item, intent, institution_name) returning id into connection;
  return connection;
end;
$$;

create function public.fluxo_bank_command(actor uuid, target uuid, command text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  connection fluxo_private.bank_connections%rowtype;
begin
  select * into connection from fluxo_private.bank_connections where id = target and owner_id = actor for update;
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

create function public.fluxo_apply_bank(target uuid, expected_revision uuid, outcome text, accounts jsonb, transactions jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from fluxo_private.bank_connections where id = target and sync_revision = expected_revision
    and status <> 'disconnecting' for update;
  if not found then return; end if;
  if outcome = 'ready' then
    delete from fluxo_private.bank_accounts where connection_id = target;
    insert into fluxo_private.bank_accounts(connection_id, provider_id, name, kind, currency, balance)
      select target, id, name, kind, currency, balance
      from jsonb_to_recordset(accounts) as a(id uuid, name text, kind text, currency text, balance numeric);
    insert into fluxo_private.bank_transactions(connection_id, provider_id, account_id, description, posted_on, amount, currency, direction)
      select target, id, account_id, description, posted_on, amount, currency, direction
      from jsonb_to_recordset(transactions) as t(id uuid, account_id uuid, description text, posted_on date, amount numeric, currency text, direction text);
  end if;
  update fluxo_private.bank_connections set status = outcome, sync_revision = null,
    synced_at = case when outcome = 'ready' then now() else synced_at end where id = target;
end;
$$;

revoke all on function public.fluxo_share_bank(uuid, uuid), public.fluxo_bank_overview(uuid, date, integer),
  public.fluxo_bank_intent(uuid), public.fluxo_register_bank(uuid, uuid, uuid, text),
  public.fluxo_bank_command(uuid, uuid, text), public.fluxo_apply_bank(uuid, uuid, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.fluxo_share_bank(uuid, uuid), public.fluxo_bank_overview(uuid, date, integer)
  to authenticated;
grant execute on function public.fluxo_bank_intent(uuid), public.fluxo_register_bank(uuid, uuid, uuid, text),
  public.fluxo_bank_command(uuid, uuid, text), public.fluxo_apply_bank(uuid, uuid, text, jsonb, jsonb) to service_role;
