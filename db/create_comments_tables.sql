-- Create comments table for SociaLens
-- This table will store all comments and replies for posts

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested replies
  is_edited BOOLEAN DEFAULT false,
  
  -- Add constraints
  CONSTRAINT comments_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2200),
  CONSTRAINT comments_no_self_parent CHECK (id != parent_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- Create composite index for efficient queries
CREATE INDEX IF NOT EXISTS comments_post_parent_created_idx ON comments(post_id, parent_id, created_at DESC);

-- Create comment_likes table for liking comments
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  
  -- Ensure a user can only like a comment once
  UNIQUE(user_id, comment_id)
);

-- Create indexes for comment_likes
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON comment_likes(user_id);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments table
CREATE POLICY "Users can view all comments" ON comments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for comment_likes table
CREATE POLICY "Users can view all comment likes" ON comment_likes
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own comment likes" ON comment_likes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for comments table
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get comment counts for posts
CREATE OR REPLACE FUNCTION get_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM comments 
        WHERE post_id = post_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get reply counts for comments
CREATE OR REPLACE FUNCTION get_reply_count(comment_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM comments 
        WHERE parent_id = comment_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
