alter table public.requests add column if not exists pickup_verified_at timestamptz;

create or replace function public.verify_pickup(p_asset_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_request public.requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  select * into v_request from public.requests where asset_id = p_asset_id and user_id = auth.uid() and status = 'APPROVED' for update;
  if not found then raise exception 'You do not have an approved checkout for this asset'; end if;
  update public.requests set pickup_verified_at = coalesce(pickup_verified_at, now()) where id = v_request.id;
end; $$;

create or replace function public.return_asset(p_asset_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_request public.requests%rowtype;
begin
  select * into v_request from public.requests where asset_id = p_asset_id and status = 'APPROVED' for update;
  if not found then raise exception 'This asset is not checked out'; end if;
  if auth.uid() is null or (auth.uid() <> v_request.user_id and not public.is_admin()) then raise exception 'Only the holder or an administrator can return this asset'; end if;
  if auth.uid() = v_request.user_id and v_request.pickup_verified_at is null then raise exception 'Scan the asset to verify pickup before returning it'; end if;
  update public.requests set status = 'COMPLETED' where id = v_request.id;
  update public.assets set status = 'AVAILABLE' where id = p_asset_id;
  insert into public.transactions(asset_id, user_id, request_id, action) values(p_asset_id, v_request.user_id, v_request.id, 'RETURN');
end; $$;

revoke all on function public.verify_pickup(uuid) from public, anon;
grant execute on function public.verify_pickup(uuid) to authenticated;
