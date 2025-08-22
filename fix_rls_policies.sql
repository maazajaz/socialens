-- Fix RLS policies with proper type casting

-- Update RLS policies for likes table to handle string/UUID conversion properly
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.likes;
CREATE POLICY "Users can insert their own likes" ON public.likes
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text
    );

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (
        auth.uid()::text = user_id::text
    );

-- Update RLS policies for saves table
DROP POLICY IF EXISTS "Users can insert their own saves" ON public.saves;
CREATE POLICY "Users can insert their own saves" ON public.saves
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text
    );

DROP POLICY IF EXISTS "Users can delete their own saves" ON public.saves;
CREATE POLICY "Users can delete their own saves" ON public.saves
    FOR DELETE USING (
        auth.uid()::text = user_id::text
    );

-- Update posts policies for better UUID handling
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" ON public.posts
    FOR INSERT WITH CHECK (
        auth.uid()::text = creator_id::text
    );

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (
        auth.uid()::text = creator_id::text
    );

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (
        auth.uid()::text = creator_id::text
    );
