-- Fix RLS policies to allow public read access to posts and comments
-- This enables shared posts to show comments to unauthenticated users

-- Update posts table policies to allow anonymous read access
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts
    FOR SELECT
    USING (true);  -- Allow both authenticated and anonymous users

-- Update comments table policies to allow anonymous read access
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT
    USING (true);  -- Allow both authenticated and anonymous users

-- Update comment_likes table policies to allow anonymous read access
DROP POLICY IF EXISTS "Users can view all comment likes" ON comment_likes;
CREATE POLICY "Anyone can view comment likes" ON comment_likes
    FOR SELECT
    USING (true);  -- Allow both authenticated and anonymous users

-- Update likes table policies to allow anonymous read access
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes
    FOR SELECT
    USING (true);  -- Allow both authenticated and anonymous users

-- Update users table policies to allow anonymous read access to profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Anyone can view profiles" ON users
    FOR SELECT
    USING (true);  -- Allow both authenticated and anonymous users

-- Note: All INSERT, UPDATE, DELETE policies remain restricted to authenticated users
-- This ensures data security while allowing public read access for sharing
