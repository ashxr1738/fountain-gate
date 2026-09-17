-- Commit queued requests idempotently from the trusted backend worker.
create or replace function public.request_asset_from_queue(
  p_request_id uuid,
  p_user_id uuid,
  p_asset_id uuid,
  p_purpose text,
  p_requested_from timestamptz,
  p_requested_until timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.asset_status;
begin
  if p_requested_until <= p_requested_from then
    raise exception 'Return time must be after the requested time';
  end if;
  if nullif(trim(p_purpose), '') is null then
    raise exception 'Purpose is required';
  end if;

  if exists (select 1 from public.requests where id = p_request_id) then
    return p_request_id;
  end if;

  select status into v_status from public.assets where id = p_asset_id for update;
  if not found then raise exception 'Asset not found'; end if;
  if v_status <> 'AVAILABLE' then raise exception 'This asset is not available'; end if;

  insert into public.requests(id, asset_id, user_id, purpose, requested_from, requested_until)
  values (p_request_id, p_asset_id, p_user_id, trim(p_purpose), p_requested_from, p_requested_until);
  update public.assets set status = 'REQUESTED' where id = p_asset_id;
  return p_request_id;
end; $$;

revoke all on function public.request_asset_from_queue(uuid, uuid, uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.request_asset_from_queue(uuid, uuid, uuid, text, timestamptz, timestamptz) to service_role;
