# Supabase Setup Guide

This project has been migrated from Appwrite to Supabase. Follow these steps to set up your Supabase database:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Wait for the project to be set up

## 2. Database Schema

Run the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Create users table
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    image_url TEXT
);

-- Create posts table
CREATE TABLE posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    caption TEXT NOT NULL,
    image_url TEXT,
    location TEXT,
    tags TEXT[],
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Create likes table
CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Create saves table
CREATE TABLE saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Create follows table
CREATE TABLE follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);
```

## 3. Row Level Security (RLS) Policies

Enable RLS and add policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = creator_id);

-- Likes policies
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Saves policies
CREATE POLICY "Users can view own saves" ON saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON saves FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE USING (auth.uid() = follower_id);
```

## 4. Storage Buckets

Create the following storage buckets in Supabase Storage:

1. `posts` - for post images
2. `avatars` - for user profile pictures

Set the buckets to public and add policies:

```sql
-- Posts bucket policy
INSERT INTO storage.policies (name, bucket_id, definition, check, command)
VALUES ('Public access', 'posts', 'true', 'true', 'SELECT');

INSERT INTO storage.policies (name, bucket_id, definition, check, command)
VALUES ('Authenticated can upload', 'posts', 'auth.uid() IS NOT NULL', 'true', 'INSERT');

-- Avatars bucket policy
INSERT INTO storage.policies (name, bucket_id, definition, check, command)
VALUES ('Public access', 'avatars', 'true', 'true', 'SELECT');

INSERT INTO storage.policies (name, bucket_id, definition, check, command)
VALUES ('Authenticated can upload', 'avatars', 'auth.uid() IS NOT NULL', 'true', 'INSERT');
```

## 5. Environment Variables

Update your `.env.local` file with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase project settings under API.

## 6. Functions/Triggers (Optional)

Create a function to automatically create a user profile when someone signs up:

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 7. Test Your Setup

1. Start your Next.js application: `npm run dev`
2. Try signing up with a new account
3. The user should be automatically created in the `users` table

## Architecture Overview

- **Authentication**: Supabase Auth with JWT tokens
- **Database**: PostgreSQL with Row Level Security
- **File Storage**: Supabase Storage for images
- **Real-time**: Supabase Realtime (can be enabled for notifications)
- **API**: Direct Supabase client calls (no separate backend needed)

This setup provides a modern, scalable architecture perfect for job interviews!
