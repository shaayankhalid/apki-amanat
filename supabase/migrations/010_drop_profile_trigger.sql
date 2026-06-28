-- Profiles are created by the signup page after auth.signUp(); remove the DB trigger.

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_user();
