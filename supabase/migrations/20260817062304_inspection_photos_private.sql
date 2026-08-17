insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false)
on conflict (id) do update
set public = excluded.public;

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
      join public.contracts c on c.billboard_id = il.billboard_id
      join public.clients cl on cl.id = c.client_id
      where split_part(name, '/', 1) = 'inspections'
        and split_part(name, '/', 2) = il.id::text
        and cl.profile_id = auth.uid()
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
