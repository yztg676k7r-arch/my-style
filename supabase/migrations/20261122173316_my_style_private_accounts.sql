create table public.my_style_accounts (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revision uuid not null,
  entries jsonb not null check (jsonb_typeof(entries) = 'object')
);
alter table public.my_style_accounts enable row level security;
revoke all on public.my_style_accounts from public, anon, authenticated;
grant select, insert, update (revision, entries) on public.my_style_accounts to authenticated;
create policy own_read on public.my_style_accounts for select to authenticated using (user_id = (select auth.uid()));
create policy own_create on public.my_style_accounts for insert to authenticated with check (user_id = (select auth.uid()));
create policy own_edit on public.my_style_accounts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
