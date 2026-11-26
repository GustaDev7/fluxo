begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('21000000-0000-4000-8000-000000000001','belvo-one@example.test',now()),
 ('21000000-0000-4000-8000-000000000002','belvo-two@example.test',now());

do $$
declare
  actor uuid := '21000000-0000-4000-8000-000000000001';
  token_lease uuid := gen_random_uuid();
begin
  perform public.fluxo_connect_belvo(actor, 'cipher-test', token_lease);
  if not public.fluxo_write_belvo_snapshot(actor, token_lease, '2026-11', '{"month":"2026-11"}') then
    raise exception 'active Belvo snapshot write failed';
  end if;
  if public.fluxo_write_belvo_snapshot(actor, gen_random_uuid(), '2026-11', '{}') then
    raise exception 'stale Belvo lease could overwrite snapshot';
  end if;
end $$;

set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
  if exists (select 1 from public.fluxo_belvo_snapshots) then raise exception 'another user could read a bank snapshot'; end if;
  perform set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
  if not exists (select 1 from public.fluxo_belvo_snapshots) then raise exception 'owner could not read bank snapshot'; end if;
  begin
    perform secret_cipher from public.fluxo_belvo_sessions;
    raise exception 'OAuth tokens accessible to an authenticated client';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select public.fluxo_disconnect_belvo('21000000-0000-4000-8000-000000000001');
do $$
begin
  if exists (select 1 from public.fluxo_belvo_snapshots) or exists (select 1 from public.fluxo_belvo_sessions) then
    raise exception 'disconnect did not clear cached data and credentials';
  end if;
end $$;
rollback;
