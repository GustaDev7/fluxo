begin;
insert into auth.users(id, email, email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000001','one@example.test',now()),
 ('10000000-0000-4000-8000-000000000002','two@example.test',now()),
 ('10000000-0000-4000-8000-000000000003','other@example.test',now());

set local role anon;
do $$
begin
  perform public.fluxo_list_workspaces();
  raise exception 'anonymous RPC access';
exception when insufficient_privilege then null;
end $$;
reset role;

set local role authenticated;
do $$
declare
  first_user text := '10000000-0000-4000-8000-000000000001';
  second_user text := '10000000-0000-4000-8000-000000000002';
  other_user text := '10000000-0000-4000-8000-000000000003';
  personal uuid;
  couple uuid;
  invite uuid;
  revision uuid;
  source uuid;
  bank_rows jsonb;
  statement_key text := repeat('a', 64);
  entries jsonb := '[{"fit_id":"demo-1","description":"Compra teste","posted_on":"2026-11-07","amount":79.90,"direction":"DEBIT"}]';
  payload jsonb := '{"accounts":[],"creditCards":[],"transactions":[],"bills":[],"debts":[],"installments":[],"goals":[],"investments":[],"budgets":[],"closings":[],"budget":{},"diagnosis":{},"emergencyFund":{}}';
begin
  perform set_config('request.jwt.claim.sub', first_user, true);
  personal := (public.fluxo_list_workspaces()->0->>'id')::uuid;
  invite := public.fluxo_invite_partner('Two@example.test');
  select (w->>'id')::uuid into couple from jsonb_array_elements(public.fluxo_list_workspaces()) w where w->>'kind' = 'couple';
  revision := public.fluxo_save_ledger(couple, null, payload);
  begin
    perform public.fluxo_save_ledger(couple, null, payload);
    raise exception 'stale first write accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.fluxo_save_ledger(couple, revision, jsonb_set(payload,'{transactions}','[{"linkedBillId":"same"},{"linkedBillId":"same"}]'));
    raise exception 'duplicate bill payment accepted';
  exception when unique_violation then null;
  end;
  begin
    perform public.fluxo_bank_intent(first_user::uuid);
    raise exception 'direct service RPC access';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', other_user, true);
  begin
    perform public.fluxo_accept_invite(invite);
    raise exception 'third party accepted an invitation';
  exception when invalid_parameter_value then null;
  end;
  perform set_config('request.jwt.claim.sub', second_user, true);
  if public.fluxo_accept_invite(invite) is distinct from couple then raise exception 'invite did not join the workspace'; end if;
  if (public.fluxo_read_ledger(couple)->>'serverRevision')::uuid is distinct from revision then
    raise exception 'partner cannot read shared ledger';
  end if;
  begin
    perform public.fluxo_read_ledger(personal);
    raise exception 'partner read a private workspace';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', first_user, true);
  if public.fluxo_import_statement(statement_key,'Banco teste','Conta pessoal','BANK','BRL',200,'2026-11-08',entries) <> 1
    then raise exception 'first OFX import failed'; end if;
  if public.fluxo_import_statement(statement_key,'Banco teste','Conta pessoal','BANK','BRL',100,'2026-11-01',entries) <> 0
    then raise exception 'duplicate OFX row'; end if;
  bank_rows := public.fluxo_bank_overview(personal,'2026-11-01');
  if (bank_rows->'connections'->0->'accounts'->0->>'balance')::numeric is distinct from 200::numeric
    then raise exception 'older OFX reverted the account balance'; end if;
  source := (bank_rows->'connections'->0->>'id')::uuid;
  perform set_config('request.jwt.claim.sub', second_user, true);
  if (public.fluxo_bank_overview(couple,'2026-11-01')->>'count')::int <> 0
    then raise exception 'private OFX leaked'; end if;
  begin
    perform public.fluxo_share_bank(source, couple);
    raise exception 'partner can share another user account';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', first_user, true);
  perform public.fluxo_share_bank(source, couple);
  perform set_config('request.jwt.claim.sub', second_user, true);
  if (public.fluxo_bank_overview(couple,'2026-11-01')->>'count')::int <> 1
    then raise exception 'partner cannot see a shared OFX'; end if;
  perform public.fluxo_leave_couple(couple);
  begin
    perform public.fluxo_read_ledger(couple);
    raise exception 'former partner retained access';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', first_user, true);
  begin
    perform public.fluxo_invite_partner('other@example.test');
    raise exception 'archived workspace allowed a new partner to read historical data';
  exception when invalid_parameter_value then null;
  end;
end $$;
rollback;
