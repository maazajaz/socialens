"use client";

import { useState } from "react";
import { useGetUserHighlights } from "@/lib/react-query/queriesAndMutations";
import { getHighlightStories } from "@/lib/supabase/api";
import StoryViewer from "./StoryViewer";
import HighlightEditor from "./HighlightEditor";
import { IStoryHighlight, IStory, IStoryGroup } from "@/types";
import { Plus } from "lucide-react";

interface StoryHighlightsProps {
  userId: string;
  isOwnProfile: boolean;
}

const StoryHighlights = ({ userId, isOwnProfile }: StoryHighlightsProps) => {
  const { data: highlights, isPending } = useGetUserHighlights(userId);
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editHighlightId, setEditHighlightId] = useState<string | null>(null);
  const [viewerStories, setViewerStories] = useState<IStory[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [isLoadingStories, setIsLoadingStories] = useState(false);

  const handleHighlightClick = async (highlightId: string) => {
    try {
      setIsLoadingStories(true);
      setSelectedHighlight(highlightId);
      const stories = await getHighlightStories(highlightId);
      setViewerStories(stories || []);
      setShowViewer(true);
    } catch (error) {
      console.error("Error loading highlight stories:", error);
    } finally {
      setIsLoadingStories(false);
    }
  };

  const handleNewClick = () => {
    setEditHighlightId(null);
    setShowEditor(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedHighlight(null);
    setViewerStories([]);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditHighlightId(null);
  };

  if (isPending) return null;

  if (!highlights?.length && !isOwnProfile) {
    return null;
  }

  const viewerStoryGroup: IStoryGroup | null = viewerStories.length > 0 ? {
    user: viewerStories[0].creator,
    stories: viewerStories,
    hasUnviewed: false,
    latestStoryAt: viewerStories[viewerStories.length - 1].created_at
  } : null;

  return (
    <div className="w-full max-w-5xl mt-6 px-5 md:px-0">
      <div className="highlight-tray">
        {isOwnProfile && (
          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={handleNewClick}
          >
            <div className="w-16 h-16 rounded-full border border-dashed border-dark-4 flex items-center justify-center bg-dark-2">
              <Plus className="w-6 h-6 text-light-2" />
            </div>
            <span className="text-[10px] text-light-2 truncate max-w-[64px]">New</span>
          </div>
        )}
        
        {highlights?.map((highlight: IStoryHighlight) => (
          <div 
            key={highlight.id}
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => handleHighlightClick(highlight.id)}
          >
            <div className={`w-16 h-16 rounded-full border border-dark-4 overflow-hidden bg-dark-2 flex items-center justify-center ${isLoadingStories && selectedHighlight === highlight.id ? 'opacity-50' : ''}`}>
              {highlight.cover_url ? (
                <img 
                  src={highlight.cover_url} 
                  alt={highlight.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-dark-3" />
              )}
            </div>
            <span className="text-[10px] text-light-2 truncate max-w-[64px]">
              {highlight.title}
            </span>
          </div>
        ))}
      </div>

      {showViewer && viewerStoryGroup && (
        <StoryViewer
          storyGroups={[viewerStoryGroup]}
          initialGroupIndex={0}
          currentUserId={userId}
          onClose={handleCloseViewer}
        />
      )}

      {showEditor && (
        <HighlightEditor
          highlightId={editHighlightId || undefined}
          onClose={handleCloseEditor}
          onSaved={() => {
            handleCloseEditor();
          }}
        />
      )}
    </div>
  );
};

export default StoryHighlights;
