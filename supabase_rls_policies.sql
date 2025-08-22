-- RLS Policies for posts table (Safe version - drops existing policies first)

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Recreate policies
CREATE POLICY "Users can insert own posts" ON posts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view all posts" ON posts
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = creator_id);

-- For likes table
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
DROP POLICY IF EXISTS "Users can view all likes" ON likes;

CREATE POLICY "Users can manage their own likes" ON likes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all likes" ON likes
    FOR SELECT
    TO authenticated
    USING (true);

-- For saves table
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own saves" ON saves;
DROP POLICY IF EXISTS "Users can view all saves" ON saves;

CREATE POLICY "Users can manage their own saves" ON saves
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all saves" ON saves
    FOR SELECT
    TO authenticated
    USING (true);

-- For users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
