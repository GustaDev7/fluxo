-- The legacy ledger exists only on projects provisioned before the new baseline.
do $$
begin
  if to_regclass('public.finance_transactions') is not null then
    create unique index if not exists finance_transactions_user_linked_bill_unique
      on public.finance_transactions (user_id, linked_bill_id)
      where linked_bill_id is not null;
  end if;
end;
$$;
