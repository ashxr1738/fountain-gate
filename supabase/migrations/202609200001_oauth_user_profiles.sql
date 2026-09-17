-- Ensure OAuth users receive a public profile and existing accounts are repaired.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Church member'
    ),
    coalesce(new.email, new.raw_user_meta_data->>'email')
  )
  on conflict (id) do update
    set name = case
      when public.users.name is null or public.users.name = '' then excluded.name
      else public.users.name
    end,
    email = case
      when public.users.email is null or public.users.email = '' then excluded.email
      else public.users.email
    end;
  return new;
end;
$$;

-- Backfill accounts created before the profile trigger was installed.
insert into public.users (id, name, email)
select
  au.id,
  coalesce(
    nullif(au.raw_user_meta_data->>'name', ''),
    nullif(au.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(coalesce(au.email, ''), '@', 1), ''),
    'Church member'
  ),
  coalesce(au.email, au.raw_user_meta_data->>'email')
from auth.users au
where coalesce(au.email, au.raw_user_meta_data->>'email') is not null
on conflict (id) do nothing;
