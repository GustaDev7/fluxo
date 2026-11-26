alter table fluxo_private.workspaces add column archived_at timestamptz;

create function fluxo_private.archive_couple_on_member_exit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.kind = 'couple' and exists (select 1 from fluxo_private.members where workspace_id = old.workspace_id) then
    update fluxo_private.workspaces set archived_at = now()
      where id = old.workspace_id and archived_at is null;
  end if;
  return old;
end;
$$;

create trigger archive_couple_on_member_exit
  after delete on fluxo_private.members for each row
  execute function fluxo_private.archive_couple_on_member_exit();

create function fluxo_private.prevent_archived_invites() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from fluxo_private.workspaces where id = new.workspace_id and archived_at is not null) then
    raise exception 'Este espaço foi encerrado. Exporte seu histórico antes de criar outro espaço.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger prevent_archived_invites
  before insert or update on fluxo_private.invitations for each row
  execute function fluxo_private.prevent_archived_invites();

revoke all on function fluxo_private.archive_couple_on_member_exit(), fluxo_private.prevent_archived_invites()
  from public, anon, authenticated;

create or replace function public.fluxo_list_workspaces() returns jsonb
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
    'id', m.workspace_id, 'kind', m.kind, 'archived', w.archived_at is not null,
    'memberCount', (select count(*) from fluxo_private.members partner where partner.workspace_id = m.workspace_id),
    'inviteEmail', (select i.email from fluxo_private.invitations i
      where i.workspace_id = m.workspace_id and i.invited_by = actor and i.expires_at > now())
  ) order by m.kind desc), '[]'::jsonb) from fluxo_private.members m join fluxo_private.workspaces w on w.id = m.workspace_id where m.user_id = actor);
end;
$$;

