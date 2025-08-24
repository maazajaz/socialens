-- Quick test script to simulate various user activity states
-- Run this to see different status indicators in action

-- Simulate user coming online (will show as "Online")
UPDATE users 
SET 
  is_active = true,
  last_active = now()
WHERE email = 'maazajaz1234@gmail.com';  -- Replace with actual user email

-- Simulate user who just left (will show as "Just left")
UPDATE users 
SET 
  is_active = false,
  last_active = now() - INTERVAL '10 minutes'
WHERE id IN (
  SELECT id FROM users 
  WHERE is_admin IS NOT true 
  ORDER BY random() 
  LIMIT 1
);

-- Simulate user active 2 hours ago (will show as "2h ago")
UPDATE users 
SET 
  is_active = false,
  last_active = now() - INTERVAL '2 hours'
WHERE id IN (
  SELECT id FROM users 
  WHERE is_admin IS NOT true AND last_active IS NULL
  ORDER BY random() 
  LIMIT 1
);

-- Simulate user active 3 days ago (will show as "3d ago")
UPDATE users 
SET 
  is_active = false,
  last_active = now() - INTERVAL '3 days'
WHERE id IN (
  SELECT id FROM users 
  WHERE is_admin IS NOT true AND last_active IS NULL
  ORDER BY random() 
  LIMIT 1
);

-- Show results
SELECT 
  name,
  username,
  is_active,
  last_active,
  CASE 
    WHEN is_deactivated = true THEN '🔴 Deactivated'
    WHEN last_active IS NULL THEN '⚪ Never active'
    WHEN is_active = true AND last_active > now() - INTERVAL '5 minutes' THEN '🟢 Online'
    WHEN last_active > now() - INTERVAL '15 minutes' THEN '🟢 Just left'
    WHEN last_active > now() - INTERVAL '1 hour' THEN 
      '🟡 ' || ROUND(EXTRACT(EPOCH FROM (now() - last_active))/60) || 'm ago'
    WHEN last_active > now() - INTERVAL '24 hours' THEN 
      '🟠 ' || ROUND(EXTRACT(EPOCH FROM (now() - last_active))/3600) || 'h ago'
    ELSE 
      '⚪ ' || ROUND(EXTRACT(EPOCH FROM (now() - last_active))/86400) || 'd ago'
  END AS expected_status
FROM users 
ORDER BY 
  CASE WHEN is_admin = true THEN 0 ELSE 1 END,
  last_active DESC NULLS LAST;
