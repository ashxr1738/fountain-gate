-- ChurchAssets standalone Supabase schema.
-- Run this file once in Supabase SQL Editor for a new project.

create type public.user_role as enum ('ADMIN', 'USER', 'DEVELOPER');
create type public.asset_status as enum ('AVAILABLE', 'REQUESTED', 'CHECKED_OUT');
create type public.request_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
create type public.transaction_action as enum ('CHECKOUT', 'RETURN');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'USER',
  created_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  asset_code text not null unique,
  category text,
  description text,
  status public.asset_status not null default 'AVAILABLE',
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  purpose text not null,
  requested_from timestamptz not null,
  requested_until timestamptz not null,
  status public.request_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.users(id) on delete restrict,
  pickup_verified_at timestamptz,
  rejection_reason text,
  check (requested_until > requested_from)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  request_id uuid not null references public.requests(id) on delete restrict,
  action public.transaction_action not null,
  timestamp timestamptz not null default now()
);

create index requests_asset_status_idx on public.requests(asset_id, status);
create index requests_user_status_idx on public.requests(user_id, status);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)), new.email);
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'DEVELOPER'));
$$;

alter table public.users enable row level security;
alter table public.assets enable row level security;
alter table public.requests enable row level security;
alter table public.transactions enable row level security;

create policy "users read own profile or admins read all" on public.users
for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "authenticated users read assets" on public.assets
for select to authenticated using (true);
create policy "admins add assets" on public.assets
for insert to authenticated with check (public.is_admin());
create policy "admins edit assets" on public.assets
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove assets" on public.assets
for delete to authenticated using (public.is_admin());
create policy "users read own requests; admins all" on public.requests
for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "users read own transactions; admins all" on public.transactions
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.request_asset(
  p_asset_id uuid,
  p_purpose text,
  p_requested_from timestamptz,
  p_requested_until timestamptz
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_request_id uuid;
  v_status public.asset_status;
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  if nullif(trim(p_purpose), '') is null then raise exception 'Purpose is required'; end if;
  if p_requested_until <= p_requested_from then raise exception 'Return time must be after the requested time'; end if;
  select status into v_status from public.assets where id = p_asset_id for update;
  if not found then raise exception 'Asset not found'; end if;
  if v_status <> 'AVAILABLE' then raise exception 'This asset is not available'; end if;
  insert into public.requests(asset_id, user_id, purpose, requested_from, requested_until)
  values (p_asset_id, auth.uid(), trim(p_purpose), p_requested_from, p_requested_until)
  returning id into v_request_id;
  update public.assets set status = 'REQUESTED' where id = p_asset_id;
  return v_request_id;
end; $$;

create or replace function public.decide_request(
  p_request_id uuid,
  p_approve boolean,
  p_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_request public.requests%rowtype;
begin
  if not public.is_admin() then raise exception 'Only administrators can approve or reject requests'; end if;
  select * into v_request from public.requests where id = p_request_id for update;
  if not found or v_request.status <> 'PENDING' then raise exception 'Request is no longer pending'; end if;
  perform 1 from public.assets where id = v_request.asset_id for update;
  if p_approve then
    update public.requests
    set status = 'APPROVED', approved_at = now(), approved_by = auth.uid(), rejection_reason = null
    where id = p_request_id;
    update public.assets set status = 'CHECKED_OUT' where id = v_request.asset_id;
    insert into public.transactions(asset_id, user_id, request_id, action)
    values (v_request.asset_id, v_request.user_id, p_request_id, 'CHECKOUT');
  else
    update public.requests
    set status = 'REJECTED', rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
    where id = p_request_id;
    update public.assets set status = 'AVAILABLE' where id = v_request.asset_id;
  end if;
end; $$;

create or replace function public.return_asset(p_asset_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_request public.requests%rowtype;
begin
  select * into v_request from public.requests
  where asset_id = p_asset_id and status = 'APPROVED' for update;
  if not found then raise exception 'This asset is not checked out'; end if;
  if auth.uid() is null or (auth.uid() <> v_request.user_id and not public.is_admin()) then
    raise exception 'Only the holder or an administrator can return this asset';
  end if;
  if auth.uid() = v_request.user_id and v_request.pickup_verified_at is null then
    raise exception 'Scan the asset to verify pickup before returning it';
  end if;
  update public.requests set status = 'COMPLETED' where id = v_request.id;
  update public.assets set status = 'AVAILABLE' where id = p_asset_id;
  insert into public.transactions(asset_id, user_id, request_id, action)
  values (p_asset_id, v_request.user_id, v_request.id, 'RETURN');
end; $$;

create or replace function public.verify_pickup(p_asset_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_request public.requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  select * into v_request from public.requests where asset_id = p_asset_id and user_id = auth.uid() and status = 'APPROVED' for update;
  if not found then raise exception 'You do not have an approved checkout for this asset'; end if;
  update public.requests set pickup_verified_at = coalesce(pickup_verified_at, now()) where id = v_request.id;
end; $$;

revoke all on function public.request_asset(uuid, text, timestamptz, timestamptz) from public;
revoke all on function public.decide_request(uuid, boolean, text) from public;
revoke all on function public.return_asset(uuid) from public;
revoke all on function public.verify_pickup(uuid) from public;
grant execute on function public.request_asset(uuid, text, timestamptz, timestamptz) to authenticated;
grant execute on function public.decide_request(uuid, boolean, text) to authenticated;
grant execute on function public.return_asset(uuid) to authenticated;
grant execute on function public.verify_pickup(uuid) to authenticated;
