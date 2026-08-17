create unique index if not exists clients_profile_id_unique
on public.clients (profile_id)
where profile_id is not null;
