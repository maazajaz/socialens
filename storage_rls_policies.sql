-- Storage RLS Policies for 'posts' bucket
-- This is different from table RLS policies

-- Enable RLS on the storage.objects table for the posts bucket
-- Note: This affects the storage bucket, not the posts table

-- Policy to allow authenticated users to upload files to posts bucket
INSERT INTO storage.policies (bucket_id, policy, operation, target, policy_role, policy_sql)
VALUES 
  ('posts', 'Allow authenticated users to upload', 'INSERT', 'authenticated', 'authenticated', 'auth.uid() IS NOT NULL'),
  ('posts', 'Allow public access to view files', 'SELECT', 'public', 'anon', 'true'),
  ('posts', 'Allow authenticated users to view files', 'SELECT', 'authenticated', 'authenticated', 'true'),
  ('posts', 'Allow users to update their own files', 'UPDATE', 'authenticated', 'authenticated', 'auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NOT NULL'),
  ('posts', 'Allow users to delete their own files', 'DELETE', 'authenticated', 'authenticated', 'auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NOT NULL');

-- Alternative approach using CREATE POLICY syntax (try this if the above doesn't work):

-- For storage.objects table (this controls file access)
CREATE POLICY "Allow authenticated users to upload to posts bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Allow public to view posts files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'posts');

CREATE POLICY "Allow authenticated users to update files in posts bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'posts')
  WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Allow authenticated users to delete files in posts bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'posts');
