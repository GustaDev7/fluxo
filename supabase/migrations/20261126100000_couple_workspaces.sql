create schema fluxo_private;
revoke all on schema fluxo_private from public, anon, authenticated;

create table fluxo_private.workspaces (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('personal', 'couple')),
  unique (id, kind)
);

create table fluxo_private.members (
  workspace_id uuid not null,
  kind text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  unique (user_id, kind),
  foreign key (workspace_id, kind) references fluxo_private.workspaces(id, kind) on delete cascade
);

create table fluxo_private.invitations (
  workspace_id uuid primary key references fluxo_private.workspaces(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default (now() + interval '48 hours')
);

create table fluxo_private.ledgers (
  workspace_id uuid primary key references fluxo_private.workspaces(id) on delete cascade,
  revision uuid not null default gen_random_uuid(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);

alter table fluxo_private.workspaces enable row level security;
alter table fluxo_private.members enable row level security;
alter table fluxo_private.invitations enable row level security;
alter table fluxo_private.ledgers enable row level security;

create function public.fluxo_list_workspaces() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  personal_id uuid;
begin
  if actor is null then raise insufficient_privilege; end if;
  perform 1 from auth.users where id = actor for no key update;
  select workspace_id into personal_id from fluxo_private.members
    where user_id = actor and kind = 'personal';
  if personal_id is null then
    insert into fluxo_private.workspaces(kind) values ('personal') returning id into personal_id;
    insert into fluxo_private.members(workspace_id, kind, user_id) values (personal_id, 'personal', actor);
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.workspace_id, 'kind', m.kind,
    'memberCount', (select count(*) from fluxo_private.members partner where partner.workspace_id = m.workspace_id),
    'inviteEmail', (select i.email from fluxo_private.invitations i
      where i.workspace_id = m.workspace_id and i.invited_by = actor and i.expires_at > now())
  ) order by m.kind desc), '[]'::jsonb) from fluxo_private.members m where m.user_id = actor);
end;
$$;

create function public.fluxo_invite_partner(partner_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  normalized_email text := lower(trim(partner_email));
  couple_id uuid;
  invitation_token uuid;
begin
  select lower(email) into actor_email from auth.users where id = actor and email_confirmed_at is not null for no key update;
  if actor_email is null then raise insufficient_privilege; end if;
  if normalized_email is null or length(normalized_email) > 320
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or normalized_email = actor_email then
    raise exception 'Informe o e-mail da outra pessoa.' using errcode = '22023';
  end if;
  select workspace_id into couple_id from fluxo_private.members where user_id = actor and kind = 'couple';
  if couple_id is null then
    insert into fluxo_private.workspaces(kind) values ('couple') returning id into couple_id;
    insert into fluxo_private.members(workspace_id, kind, user_id) values (couple_id, 'couple', actor);
  end if;
  perform 1 from fluxo_private.workspaces where id = couple_id for update;
  if (select count(*) from fluxo_private.members where workspace_id = couple_id) >= 2 then
    raise exception 'Este espaço já tem duas pessoas.' using errcode = '22023';
  end if;
  insert into fluxo_private.invitations(workspace_id, invited_by, email)
    values (couple_id, actor, normalized_email)
    on conflict (workspace_id) do update set
      email = excluded.email, invited_by = excluded.invited_by,
      token = excluded.token, expires_at = excluded.expires_at
    returning token into invitation_token;
  return invitation_token;
end;
$$;

create function public.fluxo_accept_invite(invitation_token uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  invite fluxo_private.invitations%rowtype;
begin
  select lower(email) into actor_email from auth.users where id = actor and email_confirmed_at is not null for no key update;
  if actor_email is null then raise insufficient_privilege; end if;
  select * into invite from fluxo_private.invitations where token = invitation_token;
  if not found then raise exception 'Convite inválido ou expirado.' using errcode = '22023'; end if;
  perform 1 from fluxo_private.workspaces where id = invite.workspace_id for update;
  select * into invite from fluxo_private.invitations where token = invitation_token;
  if not found or invite.email <> actor_email or invite.expires_at <= now() then
    raise exception 'Convite inválido, expirado ou destinado a outro e-mail.' using errcode = '22023';
  end if;
  if exists (select 1 from fluxo_private.members where user_id = actor and kind = 'couple')
     or (select count(*) from fluxo_private.members where workspace_id = invite.workspace_id) >= 2 then
    raise exception 'Já existe um espaço de casal para uma das partes.' using errcode = '22023';
  end if;
  insert into fluxo_private.members(workspace_id, kind, user_id) values (invite.workspace_id, 'couple', actor);
  delete from fluxo_private.invitations where workspace_id = invite.workspace_id;
  return invite.workspace_id;
end;
$$;

create function public.fluxo_leave_couple(target_workspace uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from fluxo_private.workspaces where id = target_workspace and kind = 'couple' for update;
  delete from fluxo_private.members where workspace_id = target_workspace and user_id = auth.uid() and kind = 'couple';
  if not found then raise insufficient_privilege; end if;
  delete from fluxo_private.invitations where workspace_id = target_workspace;
end;
$$;

create function public.fluxo_read_ledger(target_workspace uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from fluxo_private.members where workspace_id = target_workspace and user_id = auth.uid()) then
    raise insufficient_privilege;
  end if;
  return (select jsonb_build_object('payload', payload, 'serverRevision', revision)
    from fluxo_private.ledgers where workspace_id = target_workspace);
end;
$$;

create function public.fluxo_save_ledger(target_workspace uuid, expected_revision uuid, next_payload jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  current_revision uuid;
  saved_revision uuid;
  collection text;
begin
  perform 1 from fluxo_private.workspaces where id = target_workspace for update;
  if not exists (select 1 from fluxo_private.members where workspace_id = target_workspace and user_id = auth.uid()) then
    raise insufficient_privilege;
  end if;
  select revision into current_revision from fluxo_private.ledgers where workspace_id = target_workspace;
  if current_revision is distinct from expected_revision then
    raise exception 'LEDGER_REVISION_CONFLICT' using errcode = '40001';
  end if;
  if next_payload is null or jsonb_typeof(next_payload) <> 'object'
     or pg_column_size(next_payload) > 8388608
     or jsonb_typeof(next_payload->'budget') is distinct from 'object'
     or jsonb_typeof(next_payload->'diagnosis') is distinct from 'object'
     or jsonb_typeof(next_payload->'emergencyFund') is distinct from 'object' then
    raise exception 'Invalid ledger payload' using errcode = '22023';
  end if;
  foreach collection in array array['accounts','creditCards','transactions','bills','debts','installments','goals','investments','budgets','closings'] loop
    if jsonb_typeof(next_payload->collection) is distinct from 'array' then
      raise exception 'Invalid ledger collection: %', collection using errcode = '22023';
    end if;
  end loop;
  if exists (select tx->>'linkedBillId' from jsonb_array_elements(next_payload->'transactions') tx
    where nullif(tx->>'linkedBillId', '') is not null group by 1 having count(*) > 1) then
    raise exception 'A conta já tem um pagamento registrado.' using errcode = '23505';
  end if;
  insert into fluxo_private.ledgers(workspace_id, payload) values (target_workspace, next_payload)
    on conflict (workspace_id) do update set payload = excluded.payload, revision = excluded.revision, updated_at = now()
    returning revision into saved_revision;
  return saved_revision;
end;
$$;

revoke all on function public.fluxo_list_workspaces(), public.fluxo_invite_partner(text),
  public.fluxo_accept_invite(uuid), public.fluxo_leave_couple(uuid), public.fluxo_read_ledger(uuid),
  public.fluxo_save_ledger(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.fluxo_list_workspaces(), public.fluxo_invite_partner(text),
  public.fluxo_accept_invite(uuid), public.fluxo_leave_couple(uuid), public.fluxo_read_ledger(uuid),
  public.fluxo_save_ledger(uuid, uuid, jsonb) to authenticated;
