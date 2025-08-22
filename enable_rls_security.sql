-- Enable Row Level Security (RLS) for all tables
-- This is CRITICAL for security!

-- Enable RLS for posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS for users table  
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS for likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Enable RLS for saves table
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Enable RLS for follows table (if exists)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts table
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
CREATE POLICY "Users can view all posts" ON public.posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = creator_id::uuid);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = creator_id::uuid);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = creator_id::uuid);

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id::uuid);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id::uuid);

-- Create RLS policies for likes table
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
CREATE POLICY "Users can view all likes" ON public.likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.likes;
CREATE POLICY "Users can insert their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- Create RLS policies for saves table
DROP POLICY IF EXISTS "Users can view all saves" ON public.saves;
CREATE POLICY "Users can view all saves" ON public.saves
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own saves" ON public.saves;
CREATE POLICY "Users can insert their own saves" ON public.saves
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Users can delete their own saves" ON public.saves;
CREATE POLICY "Users can delete their own saves" ON public.saves
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- Create RLS policies for follows table
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;
CREATE POLICY "Users can view all follows" ON public.follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own follows" ON public.follows;
CREATE POLICY "Users can insert their own follows" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id::uuid);

DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
CREATE POLICY "Users can delete their own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id::uuid);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'users', 'likes', 'saves', 'follows');
