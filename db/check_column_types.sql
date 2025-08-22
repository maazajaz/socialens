-- Check the actual column types in your database
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'likes', 'saves', 'users')
AND column_name IN ('id', 'user_id', 'post_id', 'creator_id')
ORDER BY table_name, column_name;
