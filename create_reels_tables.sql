-- Reels table
CREATE TABLE reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  audio_name TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reel likes table
CREATE TABLE reel_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

-- Reel comments table
CREATE TABLE reel_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES reel_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false
);

-- Reel saves table
CREATE TABLE reel_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

-- Reel views table (tracks unique views)
CREATE TABLE reel_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reel_id, viewer_id)
);

-- Enable RLS on all tables
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_views ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_reels_creator_id ON reels(creator_id);
CREATE INDEX idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX idx_reel_likes_reel_id ON reel_likes(reel_id);
CREATE INDEX idx_reel_likes_user_id ON reel_likes(user_id);
CREATE INDEX idx_reel_comments_reel_id ON reel_comments(reel_id);
CREATE INDEX idx_reel_saves_reel_id ON reel_saves(reel_id);
CREATE INDEX idx_reel_saves_user_id ON reel_saves(user_id);
CREATE INDEX idx_reel_views_reel_id ON reel_views(reel_id);
CREATE INDEX idx_reel_views_viewer_id ON reel_views(viewer_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_reel_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reels SET view_count = view_count + 1 WHERE id = NEW.reel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-incrementing view count
CREATE TRIGGER on_reel_view_insert
  AFTER INSERT ON reel_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_reel_view_count();

-- =============== RLS Policies ===============

-- Reels: Anyone authenticated can read public reels
CREATE POLICY "anyone authenticated can read reels"
ON reels FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = reels.creator_id AND (privacy_setting = 'public' OR privacy_setting IS NULL))
  OR EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = reels.creator_id)
  OR creator_id = auth.uid()
);

CREATE POLICY "users can insert own reels"
ON reels FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "users can update own reels"
ON reels FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "users can delete own reels"
ON reels FOR DELETE USING (creator_id = auth.uid());

-- Reel Likes
CREATE POLICY "anyone can read reel likes"
ON reel_likes FOR SELECT USING (true);

CREATE POLICY "users can insert own reel likes"
ON reel_likes FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can delete own reel likes"
ON reel_likes FOR DELETE USING (user_id = auth.uid());

-- Reel Comments
CREATE POLICY "anyone can read reel comments"
ON reel_comments FOR SELECT USING (true);

CREATE POLICY "users can insert own reel comments"
ON reel_comments FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can update own reel comments"
ON reel_comments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can delete own reel comments"
ON reel_comments FOR DELETE USING (user_id = auth.uid());

-- Reel Saves
CREATE POLICY "users can read own reel saves"
ON reel_saves FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users can insert own reel saves"
ON reel_saves FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can delete own reel saves"
ON reel_saves FOR DELETE USING (user_id = auth.uid());

-- Reel Views
CREATE POLICY "creators can read views on their reels"
ON reel_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM reels WHERE reels.id = reel_views.reel_id AND reels.creator_id = auth.uid())
  OR viewer_id = auth.uid()
);

CREATE POLICY "users can insert own reel views"
ON reel_views FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Admin policies (if is_current_user_admin function exists)
CREATE POLICY "admin can manage reels"
ON reels USING (is_current_user_admin());

CREATE POLICY "admin can manage reel likes"
ON reel_likes USING (is_current_user_admin());

CREATE POLICY "admin can manage reel comments"
ON reel_comments USING (is_current_user_admin());

CREATE POLICY "admin can manage reel saves"
ON reel_saves USING (is_current_user_admin());

CREATE POLICY "admin can manage reel views"
ON reel_views USING (is_current_user_admin());

-- Create the 'reels' storage bucket (run this in Supabase dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true);

-- Storage policies for reels bucket (run after creating the bucket)
-- CREATE POLICY "anyone can read reel files" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
-- CREATE POLICY "authenticated users can upload reel files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.role() = 'authenticated');
-- CREATE POLICY "users can update own reel files" ON storage.objects FOR UPDATE USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "users can delete own reel files" ON storage.objects FOR DELETE USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);
