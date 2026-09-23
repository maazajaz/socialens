-- stories table
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  is_archived BOOLEAN DEFAULT false
);

-- story_views table
CREATE TABLE story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- story_highlights table
CREATE TABLE story_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(50) NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_order INTEGER DEFAULT 0
);

-- story_highlight_items junction table
CREATE TABLE story_highlight_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID REFERENCES story_highlights(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  UNIQUE(highlight_id, story_id)
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_highlight_items ENABLE ROW LEVEL SECURITY;

-- Auto-archive function
CREATE OR REPLACE FUNCTION auto_archive_expired_stories()
RETURNS void AS $$
BEGIN
  UPDATE stories 
  SET is_archived = true 
  WHERE expires_at < NOW() AND is_archived = false;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_stories_creator_id ON stories(creator_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_is_archived ON stories(is_archived);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX idx_story_highlights_user_id ON story_highlights(user_id);
CREATE INDEX idx_story_highlight_items_highlight_id ON story_highlight_items(highlight_id);
CREATE INDEX idx_story_highlight_items_story_id ON story_highlight_items(story_id);

-- RLS Policies

-- Stories
CREATE POLICY "anyone authenticated can read public stories"
ON stories FOR SELECT USING (
  is_archived = false 
  AND (
    EXISTS (SELECT 1 FROM users WHERE id = stories.creator_id AND privacy_setting = 'public')
    OR EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = stories.creator_id)
    OR creator_id = auth.uid()
  )
);

CREATE POLICY "users can insert own stories"
ON stories FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "users can update own stories"
ON stories FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "users can delete own stories"
ON stories FOR DELETE USING (creator_id = auth.uid());

CREATE POLICY "admin can CRUD stories"
ON stories USING (is_current_user_admin());

-- Story Views
CREATE POLICY "creator can read views on their stories"
ON story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_views.story_id AND stories.creator_id = auth.uid())
);

CREATE POLICY "viewers can insert their own views"
ON story_views FOR INSERT WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "admin can read story views"
ON story_views FOR SELECT USING (is_current_user_admin());

-- Story Highlights
CREATE POLICY "public read highlights"
ON story_highlights FOR SELECT USING (true);

CREATE POLICY "owner CRUD highlights"
ON story_highlights FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin can manage highlights"
ON story_highlights USING (is_current_user_admin());

-- Story Highlight Items
CREATE POLICY "public read highlight items"
ON story_highlight_items FOR SELECT USING (true);

CREATE POLICY "owner CRUD highlight items"
ON story_highlight_items FOR ALL USING (
  EXISTS (SELECT 1 FROM story_highlights WHERE story_highlights.id = story_highlight_items.highlight_id AND story_highlights.user_id = auth.uid())
);

CREATE POLICY "admin can manage highlight items"
ON story_highlight_items USING (is_current_user_admin());
