-- Simple Storage RLS fix
-- Run this in Supabase SQL Editor

-- Method 1: Disable RLS on storage.objects for posts bucket (simplest)
-- This allows all operations on the posts bucket
UPDATE storage.buckets SET public = true WHERE id = 'posts';

-- Method 2: Or create policies manually
-- First, make sure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to posts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to posts" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow authenticated uploads to posts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Allow public access to posts" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'posts');
