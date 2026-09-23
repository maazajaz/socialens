'use client';

import { useState } from 'react';
import { useUserContext } from '@/context/SupabaseAuthContext';
import { useGetActiveStories } from '@/lib/react-query/queriesAndMutations';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';
import { IStoryGroup } from '@/types';
import Loader from './Loader';
import { Plus } from 'lucide-react';

export default function StoriesTray() {
  const { user } = useUserContext();
  const { data: stories, isLoading } = useGetActiveStories();
  
  const [showViewer, setShowViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [showCreator, setShowCreator] = useState(false);
  
  if (isLoading) {
    return (
      <div className="stories-tray items-center justify-center h-24">
        <Loader />
      </div>
    );
  }
  
  const storyGroups: IStoryGroup[] = stories || [];
  
  const currentUserGroupIndex = storyGroups.findIndex(g => g.user.id === user?.id);
  const currentUserGroup = currentUserGroupIndex >= 0 ? storyGroups[currentUserGroupIndex] : null;
  const hasCurrentUserStory = !!currentUserGroup;
  const currentUserUnviewed = currentUserGroup?.hasUnviewed ?? false;
  
  const handleUserStoryClick = () => {
    if (hasCurrentUserStory) {
      setViewerStartIndex(currentUserGroupIndex);
      setShowViewer(true);
    } else {
      setShowCreator(true);
    }
  };

  // Don't render if no stories and no user
  if (!user) return null;

  return (
    <div className="w-full bg-dark-2 rounded-xl py-4">
      <div className="stories-tray px-4">
        {/* Current User Story */}
        <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0" onClick={handleUserStoryClick}>
          <div className="relative">
            <div className={hasCurrentUserStory ? (currentUserUnviewed ? 'story-ring-unseen' : 'story-ring-seen') : 'rounded-full p-[3px] border-2 border-dashed border-dark-4'}>
              <div className="story-ring-inner">
                <img
                  src={user.image_url || '/assets/icons/profile-placeholder.svg'}
                  alt="Your Story"
                  className="rounded-full w-14 h-14 md:w-16 md:h-16 object-cover"
                />
              </div>
            </div>
            <div 
              className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-0.5 border-2 border-dark-2 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreator(true);
              }}
            >
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="tiny-medium md:small-regular text-light-1 truncate w-14 md:w-16 text-center">
            Your Story
          </p>
        </div>
        
        {/* Other Users' Stories */}
        {storyGroups.map((group, index) => {
          if (group.user.id === user.id) return null;
          
          return (
            <div 
              key={group.user.id} 
              className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
              onClick={() => {
                setViewerStartIndex(index);
                setShowViewer(true);
              }}
            >
              <div className={group.hasUnviewed ? 'story-ring-unseen' : 'story-ring-seen'}>
                <div className="story-ring-inner">
                  <img
                    src={(group.user as any).image_url || (group.user as any).imageUrl || '/assets/icons/profile-placeholder.svg'}
                    alt={group.user.username}
                    className="rounded-full w-14 h-14 md:w-16 md:h-16 object-cover"
                  />
                </div>
              </div>
              <p className="tiny-medium md:small-regular text-light-1 truncate w-14 md:w-16 text-center">
                {group.user.username.length > 8 ? `${group.user.username.substring(0, 8)}...` : group.user.username}
              </p>
            </div>
          );
        })}
      </div>

      {showCreator && (
        <StoryCreator onClose={() => setShowCreator(false)} />
      )}
      
      {showViewer && storyGroups.length > 0 && (
        <StoryViewer 
          storyGroups={storyGroups} 
          initialGroupIndex={viewerStartIndex} 
          currentUserId={user.id}
          onClose={() => setShowViewer(false)} 
        />
      )}
    </div>
  );
}
