-- Migration 015: Add role column to profiles for RBAC
-- Enables role-based access control: user, moderator, admin

alter table public.profiles
  add column role text not null default 'user'
  check (role in ('user', 'moderator', 'admin'));

-- Index for efficient role-based queries
create index if not exists idx_profiles_role on public.profiles(role);

-- Helper function to check if current user has a specific role
create or replace function public.has_role(required_role text)
returns boolean as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is null then return false; end if;

  -- Admin has all roles, moderator has moderator + user
  case required_role
    when 'admin' then return v_role = 'admin';
    when 'moderator' then return v_role in ('admin', 'moderator');
    when 'user' then return true;
    else return false;
  end case;
end;
$$ language plpgsql stable security definer;
