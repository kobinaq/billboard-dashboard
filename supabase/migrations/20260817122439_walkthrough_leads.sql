create table if not exists public.walkthrough_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 1 and 80),
  company text not null check (char_length(company) between 1 and 120),
  email text check (
    email is null or (
      char_length(email) between 3 and 120
      and email ~* '^[^@]+@[^@]+\.[^@]+$'
    )
  ),
  phone text check (phone is null or char_length(phone) between 7 and 40),
  face_count integer not null check (face_count between 1 and 10000),
  constraint walkthrough_leads_email_or_phone check (
    email is not null or phone is not null
  )
);

alter table public.walkthrough_leads enable row level security;

revoke all on table public.walkthrough_leads from public;
revoke all on table public.walkthrough_leads from anon;
grant select on table public.walkthrough_leads to authenticated;

drop policy if exists "walkthrough_leads_admin_read" on public.walkthrough_leads;
create policy "walkthrough_leads_admin_read"
on public.walkthrough_leads
for select
to authenticated
using (public.is_admin());

comment on table public.walkthrough_leads is
  'Marketing walkthrough requests. Inserts go through the walkthrough-lead edge function.';
