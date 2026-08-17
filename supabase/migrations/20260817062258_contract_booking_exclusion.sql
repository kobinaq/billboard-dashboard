create extension if not exists btree_gist;

create sequence if not exists public.contract_number_seq;

select setval(
  'public.contract_number_seq',
  coalesce(
    (
      select max((regexp_match(contract_number, 'TKA-\d{4}-(\d{4})'))[1]::integer)
      from public.contracts
      where contract_number ~ '^TKA-\d{4}-\d{4}$'
    ),
    0
  )
);

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
  next_number := nextval('public.contract_number_seq');
  new.contract_number := format('TKA-%s-%s', contract_year, lpad(next_number::text, 4, '0'));
  return new;
end;
$$;

drop trigger if exists contracts_prevent_overlap on public.contracts;
drop function if exists public.prevent_contract_overlap();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contracts_no_overlapping_bookings'
  ) then
    alter table public.contracts
      add constraint contracts_no_overlapping_bookings
      exclude using gist (
        billboard_face_id with =,
        daterange(start_date, end_date, '[]') with &&
      )
      where (status in ('draft', 'active'));
  end if;
end $$;
