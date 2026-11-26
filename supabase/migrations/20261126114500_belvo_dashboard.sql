create table public.fluxo_belvo_sessions (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  secret_cipher text not null,
  lease_id uuid,
  lease_until timestamptz
);

create table public.fluxo_belvo_snapshots (
  owner_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, month)
);

alter table public.fluxo_belvo_sessions enable row level security;
alter table public.fluxo_belvo_snapshots enable row level security;
revoke all on public.fluxo_belvo_sessions, public.fluxo_belvo_snapshots from public, anon, authenticated;
grant select, insert, update, delete on public.fluxo_belvo_sessions, public.fluxo_belvo_snapshots to service_role;
grant select on public.fluxo_belvo_snapshots to authenticated;
create policy "Read own Belvo snapshot" on public.fluxo_belvo_snapshots
for select to authenticated using (owner_id = (select auth.uid()));

create function public.fluxo_write_belvo_snapshot(actor uuid, lease uuid, period text, data jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.fluxo_belvo_sessions where owner_id = actor and lease_id = lease for update;
  if not found then return false; end if;
  insert into public.fluxo_belvo_snapshots(owner_id, month, payload, updated_at)
    values (actor, period, data, now())
    on conflict (owner_id, month) do update set payload = excluded.payload, updated_at = excluded.updated_at;
  return true;
end;
$$;

create function public.fluxo_disconnect_belvo(actor uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.fluxo_belvo_sessions where owner_id = actor;
  delete from public.fluxo_belvo_snapshots where owner_id = actor;
end;
$$;
revoke execute on function public.fluxo_write_belvo_snapshot(uuid, uuid, text, jsonb),
  public.fluxo_disconnect_belvo(uuid) from public, anon, authenticated;
grant execute on function public.fluxo_write_belvo_snapshot(uuid, uuid, text, jsonb),
  public.fluxo_disconnect_belvo(uuid) to service_role;

create function public.fluxo_connect_belvo(actor uuid, cipher text, lease uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.fluxo_belvo_sessions(owner_id, secret_cipher, lease_id, lease_until)
    values (actor, cipher, lease, now() + interval '90 seconds')
    on conflict (owner_id) do update set
      secret_cipher = excluded.secret_cipher, lease_id = excluded.lease_id, lease_until = excluded.lease_until;
  delete from public.fluxo_belvo_snapshots where owner_id = actor;
end;
$$;
revoke execute on function public.fluxo_connect_belvo(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.fluxo_connect_belvo(uuid, text, uuid) to service_role;
