-- Reset existing users' activity status with realistic timing patterns
-- This will make existing users show diverse, realistic activity status

-- Set most existing users as inactive with no last_active timestamp (never active)
UPDATE users 
SET 
  is_active = false,
  last_active = NULL
WHERE is_admin IS NOT true OR is_admin IS NULL;

-- Create realistic activity patterns for testing

-- Admins: Set as last active 1-2 days ago
UPDATE users 
SET 
  is_active = false,
  last_active = now() - INTERVAL '1 day' - (random() * INTERVAL '24 hours')
WHERE is_admin = true;

-- For demo purposes, let's create some varied activity patterns
-- (Uncomment these if you want to test different timing scenarios)

-- Some users active within last few hours (3-12 hours ago)
/*
UPDATE users 
SET 
  is_active = false,
  last_active = now() - INTERVAL '3 hours' - (random() * INTERVAL '9 hours')
WHERE id IN (
  SELECT id FROM users 
  WHERE is_admin IS NOT true 
  ORDER BY random() 
  LIMIT 3
);
*/

-- Some users active within last few minutes (2-30 minutes ago)
/*
UPDATE users 
SET 
  is_active = false,
  last_active = now() - INTERVAL '2 minutes' - (random() * INTERVAL '28 minutes')
WHERE id IN (
  SELECT id FROM users 
  WHERE is_admin IS NOT true AND last_active IS NULL
  ORDER BY random() 
  LIMIT 2
);
*/

-- Some users active within last few days (2-7 days ago)
/*
UPDATE users 
SET 
  is_active = false,
  last_active = now() - INTERVAL '2 days' - (random() * INTERVAL '5 days')
WHERE id IN (
  SELECT id FROM users 
  WHERE is_admin IS NOT true AND last_active IS NULL
  ORDER BY random() 
  LIMIT 4
);
*/

-- Show current status of all users with realistic display
SELECT 
  name,
  username,
  email,
  is_active,
  is_deactivated,
  last_active,
  CASE 
    WHEN is_deactivated = true THEN '🔴 Deactivated'
    WHEN last_active IS NULL THEN '⚪ Never active'
    WHEN is_active = true AND last_active > now() - INTERVAL '5 minutes' THEN '🟢 Online'
    WHEN last_active > now() - INTERVAL '15 minutes' THEN '🟢 Just left'
    WHEN last_active > now() - INTERVAL '1 hour' THEN 
      '🟡 ' || EXTRACT(EPOCH FROM (now() - last_active))/60 || 'm ago'
    WHEN last_active > now() - INTERVAL '24 hours' THEN 
      '🟠 ' || EXTRACT(EPOCH FROM (now() - last_active))/3600 || 'h ago'
    ELSE 
      '⚪ ' || EXTRACT(EPOCH FROM (now() - last_active))/86400 || 'd ago'
  END AS status_display
FROM users 
ORDER BY 
  CASE WHEN is_admin = true THEN 0 ELSE 1 END,
  last_active DESC NULLS LAST;
