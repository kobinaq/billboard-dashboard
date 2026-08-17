create or replace function public.sync_contract_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contracts c
  set status = computed.next_status,
    updated_at = now()
  from (
    select
      id,
      case
        when status in ('cancelled', 'draft') then status
        when end_date < current_date then 'expired'
        when start_date <= current_date and end_date >= current_date then 'active'
        else status
      end as next_status
    from public.contracts
  ) computed
  where c.id = computed.id
    and c.status is distinct from computed.next_status;

  update public.billboards b
  set status = computed.next_status,
    updated_at = now()
  from (
    select
      b_inner.id,
      case
        when b_inner.status in ('maintenance', 'retired') then b_inner.status
        when exists (
          select 1
          from public.billboard_faces bf
          where bf.billboard_id = b_inner.id
            and bf.is_active = true
        )
        and not exists (
          select 1
          from public.billboard_faces bf
          where bf.billboard_id = b_inner.id
            and bf.is_active = true
            and not exists (
              select 1
              from public.contracts c
              where c.billboard_face_id = bf.id
                and c.status = 'active'
                and c.start_date <= current_date
                and c.end_date >= current_date
            )
        ) then 'occupied'
        else case when b_inner.status = 'occupied' then 'available' else b_inner.status end
      end as next_status
    from public.billboards b_inner
  ) computed
  where b.id = computed.id
    and b.status is distinct from computed.next_status;
end;
$$;

revoke all on function public.sync_contract_statuses() from public;
revoke all on function public.sync_contract_statuses() from anon;
grant execute on function public.sync_contract_statuses() to authenticated;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'sync-contract-statuses-daily';
  perform cron.schedule(
    'sync-contract-statuses-daily',
    '15 0 * * *',
    'select public.sync_contract_statuses()'
  );
exception
  when others then
    null;
end $$;
