-- Temporary fix: Disable RLS to test basic functionality
-- Run this first to test if posts can be created without RLS

-- Disable RLS temporarily on posts table
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Test creating a post now
-- If this works, the issue is with RLS policies
-- If this doesn't work, the issue is with the table structure or API

-- After testing, you can re-enable RLS:
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
