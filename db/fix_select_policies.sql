-- Fix RLS SELECT policy for saves table to allow users to read their own saves
DROP POLICY IF EXISTS "Users can view all saves" ON public.saves;
CREATE POLICY "Users can read their own saves" ON public.saves
    FOR SELECT USING (
        auth.uid()::text = user_id::text
    );

-- Also allow users to read saves to determine if posts are saved (for UI state)
DROP POLICY IF EXISTS "Users can view saves for UI state" ON public.saves;
CREATE POLICY "Users can view saves for UI state" ON public.saves
    FOR SELECT USING (true);

-- Let's also check if there are any issues with the likes table
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;  
CREATE POLICY "Users can view likes for UI state" ON public.likes
    FOR SELECT USING (true);
