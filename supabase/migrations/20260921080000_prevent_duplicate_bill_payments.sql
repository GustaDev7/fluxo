-- A bill can produce at most one ledger transaction per user.
-- The client also guards double taps, while this index is the final database guarantee.
create unique index if not exists finance_transactions_user_linked_bill_unique
on public.finance_transactions (user_id, linked_bill_id)
where linked_bill_id is not null;
