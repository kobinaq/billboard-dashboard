create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    company_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    new.raw_user_meta_data ->> 'company_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null check (role in ('admin', 'sales', 'inspector', 'client')),
  company_name text,
  avatar_url text,
  is_active boolean not null default true,
  deactivated_at timestamptz,
  deactivation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivation_reason text;

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.billboard_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.billboards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  type text not null,
  status text not null default 'available' check (status in ('available', 'occupied', 'maintenance', 'retired')),
  width_ft numeric,
  height_ft numeric,
  latitude numeric not null,
  longitude numeric not null,
  address text not null,
  region text not null,
  facing_direction text,
  traffic_count text,
  illuminated boolean not null default false,
  notes text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  industry text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text not null unique,
  client_id uuid not null references public.clients(id) on delete cascade,
  billboard_id uuid not null references public.billboards(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  monthly_rate numeric not null check (monthly_rate > 0),
  total_value numeric generated always as (
    monthly_rate * (
      ((date_part('year', age(end_date, start_date)) * 12)
      + date_part('month', age(end_date, start_date))) + 1
    )
  ) stored,
  currency text not null default 'GHS',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  amount_paid numeric not null default 0,
  artwork_url text,
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'cancelled')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_dates_valid check (end_date >= start_date)
);

create table if not exists public.inspection_logs (
  id uuid primary key default gen_random_uuid(),
  billboard_id uuid not null references public.billboards(id) on delete cascade,
  inspector_id uuid not null references public.profiles(id) on delete cascade,
  inspected_at timestamptz not null default now(),
  overall_condition text not null check (overall_condition in ('excellent', 'good', 'fair', 'poor', 'critical')),
  structure_ok boolean not null default true,
  lighting_ok boolean not null default true,
  artwork_ok boolean not null default true,
  visibility_ok boolean not null default true,
  notes text,
  action_required boolean not null default false,
  action_description text,
  action_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspection_logs(id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_date date not null,
  payment_method text check (payment_method in ('bank_transfer', 'cash', 'cheque', 'mobile_money')),
  reference text,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.regions (name)
values ('Greater Accra'), ('Ashanti'), ('Central'), ('Eastern')
on conflict (name) do nothing;

insert into public.billboard_types (name)
values ('traditional'), ('digital')
on conflict (name) do nothing;

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_sales_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('admin', 'sales');
$$;

create or replace function public.is_inspector()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'inspector';
$$;

create or replace function public.is_client()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'client';
$$;

create or replace function public.generate_contract_number()
returns trigger
language plpgsql
as $$
declare
  contract_year text;
  next_number integer;
begin
  if new.contract_number is not null and new.contract_number <> '' then
    return new;
  end if;

  contract_year := to_char(coalesce(new.start_date, current_date), 'YYYY');

  select coalesce(max((regexp_match(contract_number, 'TKA-\d{4}-(\d{4})'))[1]::integer), 0) + 1
  into next_number
  from public.contracts
  where contract_number like 'TKA-' || contract_year || '-%';

  new.contract_number := format('TKA-%s-%s', contract_year, lpad(next_number::text, 4, '0'));
  return new;
end;
$$;

create or replace function public.prevent_contract_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.contracts c
    where c.billboard_id = new.billboard_id
      and c.id <> coalesce(new.id, gen_random_uuid())
      and c.status in ('draft', 'active')
      and daterange(c.start_date, c.end_date, '[]') && daterange(new.start_date, new.end_date, '[]')
  ) then
    raise exception 'Billboard is already booked for the selected date range.';
  end if;

  return new;
end;
$$;

create or replace function public.sync_contract_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contracts
  set status = case
    when status = 'cancelled' then status
    when end_date < current_date then 'expired'
    when start_date <= current_date and end_date >= current_date then 'active'
    else status
  end,
  updated_at = now();

  update public.billboards b
  set status = case
    when exists (
      select 1
      from public.contracts c
      where c.billboard_id = b.id
        and c.status = 'active'
        and c.start_date <= current_date
        and c.end_date >= current_date
    ) then 'occupied'
    else case when b.status = 'occupied' then 'available' else b.status end
  end,
  updated_at = now();
end;
$$;

create or replace function public.sync_billboard_status_from_contract()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_contract_statuses();
  return new;
end;
$$;

create or replace function public.rollup_contract_payments()
returns trigger
language plpgsql
as $$
declare
  target_contract uuid;
begin
  target_contract := coalesce(new.contract_id, old.contract_id);

  update public.contracts c
  set amount_paid = coalesce((
      select sum(p.amount)
      from public.payments p
      where p.contract_id = target_contract
    ), 0),
    payment_status = case
      when coalesce((
        select sum(p.amount)
        from public.payments p
        where p.contract_id = target_contract
      ), 0) >= c.total_value then 'paid'
      when coalesce((
        select sum(p.amount)
        from public.payments p
        where p.contract_id = target_contract
      ), 0) > 0 then 'partial'
      else 'unpaid'
    end,
    updated_at = now()
  where c.id = target_contract;

  return coalesce(new, old);
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_current_timestamp();

drop trigger if exists billboards_set_updated_at on public.billboards;
create trigger billboards_set_updated_at
before update on public.billboards
for each row execute function public.set_current_timestamp();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_current_timestamp();

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.set_current_timestamp();

drop trigger if exists create_profile_on_signup on auth.users;
create trigger create_profile_on_signup
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists contracts_generate_number on public.contracts;
create trigger contracts_generate_number
before insert on public.contracts
for each row execute function public.generate_contract_number();

drop trigger if exists contracts_prevent_overlap on public.contracts;
create trigger contracts_prevent_overlap
before insert or update on public.contracts
for each row execute function public.prevent_contract_overlap();

drop trigger if exists contracts_sync_billboards on public.contracts;
create trigger contracts_sync_billboards
after insert or update or delete on public.contracts
for each row execute function public.sync_billboard_status_from_contract();

drop trigger if exists payments_rollup_contract_totals on public.payments;
create trigger payments_rollup_contract_totals
after insert or update or delete on public.payments
for each row execute function public.rollup_contract_payments();

alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.billboard_types enable row level security;
alter table public.billboards enable row level security;
alter table public.clients enable row level security;
alter table public.contracts enable row level security;
alter table public.inspection_logs enable row level security;
alter table public.inspection_photos enable row level security;
alter table public.payments enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_sales_or_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (
  (
    id = auth.uid()
    and public.is_active_user()
    and role = (select role from public.profiles where id = auth.uid())
    and is_active = (select is_active from public.profiles where id = auth.uid())
  )
  or public.is_admin()
);

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "regions_read_all" on public.regions;
create policy "regions_read_all"
on public.regions
for select
to authenticated
using (true);

drop policy if exists "regions_admin_manage" on public.regions;
create policy "regions_admin_manage"
on public.regions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "types_read_all" on public.billboard_types;
create policy "types_read_all"
on public.billboard_types
for select
to authenticated
using (true);

drop policy if exists "types_admin_manage" on public.billboard_types;
create policy "types_admin_manage"
on public.billboard_types
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "billboards_read_by_internal_and_clients" on public.billboards;
create policy "billboards_read_by_internal_and_clients"
on public.billboards
for select
to authenticated
using (
  public.is_active_user()
  and (
    public.current_role() in ('admin', 'sales', 'inspector')
    or exists (
      select 1
      from public.contracts c
      join public.clients cl on cl.id = c.client_id
      where c.billboard_id = billboards.id
        and cl.profile_id = auth.uid()
    )
  )
);

drop policy if exists "billboards_sales_admin_manage" on public.billboards;
create policy "billboards_sales_admin_manage"
on public.billboards
for all
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

drop policy if exists "clients_read_admin_sales" on public.clients;
create policy "clients_read_admin_sales"
on public.clients
for select
to authenticated
using (
  public.is_active_user()
  and (
    public.is_sales_or_admin()
    or profile_id = auth.uid()
  )
);

drop policy if exists "clients_manage_admin_sales" on public.clients;
create policy "clients_manage_admin_sales"
on public.clients
for all
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

drop policy if exists "contracts_read_access" on public.contracts;
create policy "contracts_read_access"
on public.contracts
for select
to authenticated
using (
  public.is_active_user()
  and (
    public.is_sales_or_admin()
    or public.is_inspector()
    or exists (
      select 1
      from public.clients cl
      where cl.id = contracts.client_id
        and cl.profile_id = auth.uid()
    )
  )
);

drop policy if exists "contracts_manage_admin_sales" on public.contracts;
create policy "contracts_manage_admin_sales"
on public.contracts
for all
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

drop policy if exists "inspection_logs_read_access" on public.inspection_logs;
create policy "inspection_logs_read_access"
on public.inspection_logs
for select
to authenticated
using (
  public.is_active_user()
  and (
    public.current_role() in ('admin', 'sales', 'inspector')
    or exists (
      select 1
      from public.contracts c
      join public.clients cl on cl.id = c.client_id
      where c.billboard_id = inspection_logs.billboard_id
        and cl.profile_id = auth.uid()
    )
  )
);

drop policy if exists "inspection_logs_insert_inspector" on public.inspection_logs;
create policy "inspection_logs_insert_inspector"
on public.inspection_logs
for insert
to authenticated
with check (
  public.is_active_user()
  and (
    public.current_role() in ('admin', 'sales')
    or (public.is_inspector() and inspector_id = auth.uid())
  )
);

drop policy if exists "inspection_logs_update_inspector" on public.inspection_logs;
create policy "inspection_logs_update_inspector"
on public.inspection_logs
for update
to authenticated
using (
  public.is_active_user()
  and (
    public.current_role() in ('admin', 'sales')
    or (public.is_inspector() and inspector_id = auth.uid())
  )
)
with check (
  public.is_active_user()
  and (
    public.current_role() in ('admin', 'sales')
    or (public.is_inspector() and inspector_id = auth.uid())
  )
);

drop policy if exists "inspection_photos_read_access" on public.inspection_photos;
create policy "inspection_photos_read_access"
on public.inspection_photos
for select
to authenticated
using (
  public.is_active_user()
  and
  exists (
    select 1
    from public.inspection_logs il
    where il.id = inspection_photos.inspection_id
      and (
        public.current_role() in ('admin', 'sales', 'inspector')
        or exists (
          select 1
          from public.contracts c
          join public.clients cl on cl.id = c.client_id
          where c.billboard_id = il.billboard_id
            and cl.profile_id = auth.uid()
        )
      )
  )
);

drop policy if exists "inspection_photos_insert_access" on public.inspection_photos;
create policy "inspection_photos_insert_access"
on public.inspection_photos
for insert
to authenticated
with check (
  public.is_active_user()
  and
  exists (
    select 1
    from public.inspection_logs il
    where il.id = inspection_photos.inspection_id
      and (
        public.current_role() in ('admin', 'sales')
        or (public.is_inspector() and il.inspector_id = auth.uid())
      )
  )
);

drop policy if exists "payments_read_admin_sales" on public.payments;
create policy "payments_read_admin_sales"
on public.payments
for select
to authenticated
using (public.is_sales_or_admin());

drop policy if exists "payments_manage_admin_sales" on public.payments;
create policy "payments_manage_admin_sales"
on public.payments
for all
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

insert into storage.buckets (id, name, public)
values
  ('billboard-media', 'billboard-media', true),
  ('contract-artwork', 'contract-artwork', false)
on conflict (id) do nothing;

drop policy if exists "billboard_media_read" on storage.objects;
create policy "billboard_media_read"
on storage.objects
for select
to authenticated
using (bucket_id = 'billboard-media');

drop policy if exists "billboard_media_write" on storage.objects;
create policy "billboard_media_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'billboard-media'
  and public.is_active_user()
  and public.current_role() in ('admin', 'sales', 'inspector')
);

drop policy if exists "billboard_media_update" on storage.objects;
create policy "billboard_media_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'billboard-media'
  and public.is_active_user()
  and public.current_role() in ('admin', 'sales', 'inspector')
)
with check (
  bucket_id = 'billboard-media'
  and public.is_active_user()
  and public.current_role() in ('admin', 'sales', 'inspector')
);

drop policy if exists "contract_artwork_read" on storage.objects;
create policy "contract_artwork_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'contract-artwork'
  and public.is_active_user()
  and (
    public.is_sales_or_admin()
    or exists (
      select 1
      from public.contracts c
      join public.clients cl on cl.id = c.client_id
      where split_part(name, '/', 1) = 'contracts'
        and split_part(name, '/', 2) = c.id::text
        and cl.profile_id = auth.uid()
    )
  )
);

drop policy if exists "contract_artwork_write" on storage.objects;
create policy "contract_artwork_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'contract-artwork'
  and public.is_active_user()
  and (
    public.is_sales_or_admin()
    or exists (
      select 1
      from public.contracts c
      join public.clients cl on cl.id = c.client_id
      where split_part(name, '/', 1) = 'contracts'
        and split_part(name, '/', 2) = c.id::text
        and cl.profile_id = auth.uid()
    )
  )
);

comment on table public.billboards is 'Upload cover images to billboard-media under billboards/{billboardId}/cover-*';
comment on table public.inspection_photos is 'Upload inspection images to billboard-media under inspections/{inspectionId}/{photoId}-*';
comment on table public.contracts is 'Upload artwork to contract-artwork under contracts/{contractId}/artwork-*';
