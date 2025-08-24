-- Add user status columns to the users table
-- Run this script in your Supabase SQL editor

-- Add is_active column (default to false - will be set to true when user logs in)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Add is_deactivated column (default to false for existing users)  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT false;

-- Add last_active timestamp to track when user was last active
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;

-- Update existing users to have proper default values
UPDATE users 
SET 
  is_active = false,  -- Will be set to true when they log in
  is_deactivated = false,
  last_active = NULL  -- Set to NULL so they show as "Never active" until they actually log in
WHERE is_active IS NULL OR is_deactivated IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.is_active IS 'Indicates if the user is currently online/active (dynamic)';
COMMENT ON COLUMN users.is_deactivated IS 'Indicates if the user account has been deactivated by admin (static)';
COMMENT ON COLUMN users.last_active IS 'Timestamp of when the user was last active';

-- Create index for performance on deactivation checks
CREATE INDEX IF NOT EXISTS idx_users_is_deactivated ON users(is_deactivated);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Create a function to automatically set users as inactive after 15 minutes of inactivity
CREATE OR REPLACE FUNCTION auto_set_inactive_users()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET is_active = false 
  WHERE is_active = true 
    AND is_deactivated = false
    AND last_active < now() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a periodic job to run the function (uncomment if you want automatic cleanup)
-- SELECT cron.schedule('auto-inactive-users', '*/2 minutes', 'SELECT auto_set_inactive_users();');

-- Show the updated schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
