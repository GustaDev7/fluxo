create table public.finance_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.finance_assistant_messages enable row level security;

create index finance_assistant_messages_user_created_idx
  on public.finance_assistant_messages (user_id, created_at desc);

revoke all on table public.finance_assistant_messages from anon;
grant select, insert, update, delete on table public.finance_assistant_messages to authenticated;

create policy "finance_assistant_messages_select_own"
  on public.finance_assistant_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "finance_assistant_messages_insert_own"
  on public.finance_assistant_messages
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "finance_assistant_messages_update_own"
  on public.finance_assistant_messages
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "finance_assistant_messages_delete_own"
  on public.finance_assistant_messages
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
