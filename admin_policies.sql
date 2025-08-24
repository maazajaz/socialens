-- Admin RLS policies for enhanced admin functionality
-- Run these in your Supabase SQL editor

-- Function to check if user is admin (helper function for policies)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = user_id 
    AND is_admin = true
  );
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT is_admin_user(auth.uid());
$$;

-- Policies for admin access to all user data
-- Allow admins to read all user data
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (is_current_user_admin());

-- Allow admins to update user status (for deactivation)
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  USING (is_current_user_admin());

-- Policies for admin access to all posts
-- Allow admins to read all posts
CREATE POLICY "Admins can view all posts" ON posts
  FOR SELECT
  USING (is_current_user_admin());

-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post" ON posts
  FOR DELETE
  USING (is_current_user_admin());

-- Policies for admin access to comments (for moderation)
CREATE POLICY "Admins can view all comments" ON comments
  FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Admins can delete any comment" ON comments
  FOR DELETE
  USING (is_current_user_admin());

-- Policies for admin access to likes (for analytics)
CREATE POLICY "Admins can view all likes" ON likes
  FOR SELECT
  USING (is_current_user_admin());

-- Policies for admin access to follows (for analytics)
CREATE POLICY "Admins can view all follows" ON follows
  FOR SELECT
  USING (is_current_user_admin());

-- Policies for admin access to saves (for analytics)
CREATE POLICY "Admins can view all saves" ON saves
  FOR SELECT
  USING (is_current_user_admin());

-- Optional: Add audit logging for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES users(id) NOT NULL,
  action_type TEXT NOT NULL, -- 'deactivate_user', 'delete_post', 'delete_comment', etc.
  target_type TEXT NOT NULL, -- 'user', 'post', 'comment', etc.
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can insert audit logs
CREATE POLICY "Only admins can create audit logs" ON admin_audit_log
  FOR INSERT
  WITH CHECK (is_current_user_admin());

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit logs" ON admin_audit_log
  FOR SELECT
  USING (is_current_user_admin());

-- Grant necessary permissions to authenticated users
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON posts TO authenticated;
GRANT SELECT ON comments TO authenticated;
GRANT SELECT ON likes TO authenticated;
GRANT SELECT ON follows TO authenticated;
GRANT SELECT ON saves TO authenticated;
GRANT INSERT, SELECT ON admin_audit_log TO authenticated;
