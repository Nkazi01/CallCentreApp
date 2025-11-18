-- ============================================
-- Database Trigger to Auto-Create User Profiles
-- This trigger automatically creates a profile in public.users
-- when a user confirms their email in Supabase Auth
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_username text;
  user_full_name text;
  user_role text;
BEGIN
  -- Extract metadata from auth.users raw_user_meta_data
  user_username := NEW.raw_user_meta_data->>'username';
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'agent'); -- Default to 'agent'
  
  -- Only create profile if username is provided (prevents duplicates)
  IF user_username IS NOT NULL THEN
    -- Insert into public.users table
    -- Note: password field is not required when using Supabase Auth
    INSERT INTO public.users (id, username, password, full_name, email, role, active)
    VALUES (
      NEW.id,
      user_username,
      '', -- Empty password since we use Supabase Auth
      COALESCE(user_full_name, NEW.email), -- Fallback to email if no full_name
      NEW.email,
      user_role::user_role,
      true
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users table when a new user is created
-- Note: This trigger fires when user is created, even if email is not confirmed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Alternative: Trigger when user confirms email (email_confirmed_at changes from NULL to a timestamp)
-- This is more reliable when email confirmation is required
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_username text;
  user_full_name text;
  user_role text;
  profile_exists boolean;
BEGIN
  -- Only proceed if email was just confirmed (was NULL, now has value)
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL) THEN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO profile_exists;
    
    -- Only create if profile doesn't exist
    IF NOT profile_exists THEN
      -- Extract metadata from auth.users raw_user_meta_data
      user_username := NEW.raw_user_meta_data->>'username';
      user_full_name := NEW.raw_user_meta_data->>'full_name';
      user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'agent');
      
      -- Create profile with fallbacks
      -- Note: password field is not required when using Supabase Auth
      INSERT INTO public.users (id, username, password, full_name, email, role, active)
      VALUES (
        NEW.id,
        COALESCE(user_username, split_part(NEW.email, '@', 1)), -- Use email prefix if no username
        '', -- Empty password since we use Supabase Auth
        COALESCE(user_full_name, NEW.email),
        NEW.email,
        user_role::user_role,
        true
      )
      ON CONFLICT (id) DO UPDATE
      SET 
        username = COALESCE(EXCLUDED.username, public.users.username),
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        email = EXCLUDED.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on email confirmation
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmed();

