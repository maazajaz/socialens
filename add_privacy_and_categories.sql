-- Add privacy settings and post categories
-- Run this script in your Supabase SQL editor

-- Add privacy setting to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS privacy_setting VARCHAR(20) DEFAULT 'public' CHECK (privacy_setting IN ('public', 'private', 'followers_only'));

-- Add category to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'announcement', 'question'));

-- Update existing posts to have default category
UPDATE posts 
SET category = 'general' 
WHERE category IS NULL;

-- Update existing users to have default privacy setting
UPDATE users 
SET privacy_setting = 'public' 
WHERE privacy_setting IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.privacy_setting IS 'Profile and post visibility: public, private, followers_only';
COMMENT ON COLUMN posts.category IS 'Post category: general, announcement, question';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_privacy_setting ON users(privacy_setting);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Show the updated schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('users', 'posts') 
AND column_name IN ('privacy_setting', 'category')
ORDER BY table_name, ordinal_position;
