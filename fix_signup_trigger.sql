-- Fix signup process by creating a trigger to automatically create user profiles
-- Run this script in your Supabase SQL editor

-- First, let's create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username, image_url, bio, is_active, is_deactivated, last_active, privacy_setting)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NULL,
    NULL,
    FALSE,
    FALSE,
    NULL,
    'public'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    username = COALESCE(EXCLUDED.username, users.username),
    privacy_setting = COALESCE(EXCLUDED.privacy_setting, users.privacy_setting);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger (drop first if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- Test the trigger function
SELECT 'Trigger created successfully' AS status;
