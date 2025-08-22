-- Debug: Check the actual data types in the saves table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'saves'
ORDER BY ordinal_position;

-- Debug: Check RLS policies on saves table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'saves';

-- Debug: Check current user authentication
SELECT auth.uid() as current_user_id;

-- Debug: Try a simple select from saves table to see if we can read
SELECT * FROM saves LIMIT 1;
