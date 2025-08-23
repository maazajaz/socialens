-- Enable public read access for basic user profile information
-- This allows unauthenticated users to view shared profiles

-- Allow public read access to users table for basic profile info
CREATE POLICY "Allow public read access to user profiles" ON users
  FOR SELECT USING (true);

-- Allow public read access to posts table for shared content  
CREATE POLICY "Allow public read access to posts" ON posts
  FOR SELECT USING (true);

-- Allow public read access to likes for post interaction counts
CREATE POLICY "Allow public read access to likes" ON likes
  FOR SELECT USING (true);

-- Allow public read access to saves for post interaction counts
CREATE POLICY "Allow public read access to saves" ON saves
  FOR SELECT USING (true);

-- Allow public read access to follows for follower/following counts
CREATE POLICY "Allow public read access to follows" ON follows
  FOR SELECT USING (true);
