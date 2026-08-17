insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false)
on conflict (id) do update
set public = excluded.public;

create or replace function public.client_can_view_billboard_inspection(
  p_billboard_id uuid,
  p_inspected_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contracts c
    join public.clients cl on cl.id = c.client_id
    where c.billboard_id = p_billboard_id
      and cl.profile_id = auth.uid()
      and c.status <> 'cancelled'
      and (p_inspected_at at time zone 'utc')::date between c.start_date and c.end_date
  );
$$;

drop policy if exists "inspection_logs_read_access" on public.inspection_logs;
create policy "inspection_logs_read_access"
on public.inspection_logs
for select
to authenticated
using (
  public.is_active_user()
  and (
    public.current_role() in ('admin', 'sales', 'inspector')
    or public.client_can_view_billboard_inspection(billboard_id, inspected_at)
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
        or public.client_can_view_billboard_inspection(il.billboard_id, il.inspected_at)
      )
  )
);

drop policy if exists "inspection_photos_storage_read" on storage.objects;
create policy "inspection_photos_storage_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'inspection-photos'
  and public.is_active_user()
  and (
    public.current_role() in ('admin', 'sales', 'inspector')
    or exists (
      select 1
      from public.inspection_logs il
      where split_part(name, '/', 1) = 'inspections'
        and split_part(name, '/', 2) = il.id::text
        and public.client_can_view_billboard_inspection(il.billboard_id, il.inspected_at)
    )
  )
);

drop policy if exists "inspection_photos_storage_write" on storage.objects;
create policy "inspection_photos_storage_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'inspection-photos'
  and public.is_active_user()
  and public.current_role() in ('admin', 'sales', 'inspector')
);

comment on table public.inspection_photos is
  'Store inspection image paths in inspection-photos under inspections/{inspectionId}/';
