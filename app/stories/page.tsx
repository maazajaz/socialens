'use client';

import AppLayout from '../components/AppLayout';
import { useState } from 'react';
import { useGetArchivedStories } from '../../src/lib/react-query/queriesAndMutations';
import { useUserContext } from '../../src/context/SupabaseAuthContext';
import Loader from '../../src/components/shared/Loader';
import StoryViewer from '../../src/components/shared/StoryViewer';
import { IStoryGroup } from '../../src/types';
import { Archive, Play } from 'lucide-react';

function StoriesArchivePage() {
  const { user } = useUserContext();
  const { data: archivedStories, isPending } = useGetArchivedStories();
  const [showViewer, setShowViewer] = useState(false);

  const handleStoryClick = (_index: number) => {
    setShowViewer(true);
  };

  if (isPending) {
    return (
      <div className="flex-center w-full h-full py-20">
        <Loader />
      </div>
    );
  }

  // Create a story group for the viewer
  const storyGroup: IStoryGroup[] = archivedStories && archivedStories.length > 0
    ? [{
        user: {
          id: user?.id || '',
          name: user?.name || '',
          username: user?.username || '',
          email: user?.email || '',
          imageUrl: (user as any)?.imageUrl || (user as any)?.image_url || '',
          bio: user?.bio || '',
        },
        stories: archivedStories,
        hasUnviewed: false,
        latestStoryAt: archivedStories[0]?.created_at || '',
      }]
    : [];

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <Archive className="w-9 h-9 text-primary-500" />
          <h2 className="h3-bold md:h2-bold text-left w-full">Story Archive</h2>
        </div>

        <p className="text-light-3 text-sm w-full max-w-5xl">
          Your stories are automatically archived after 24 hours. You can add them to highlights on your profile.
        </p>

        {!archivedStories || archivedStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-dark-3 flex items-center justify-center mb-4">
              <Archive className="w-8 h-8 text-light-4" />
            </div>
            <h3 className="text-light-2 text-lg font-semibold mb-2">No archived stories</h3>
            <p className="text-light-4 text-sm max-w-sm">
              When your stories expire after 24 hours, they&apos;ll appear here. You can then add them to highlights on your profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 w-full max-w-5xl">
            {archivedStories.map((story: any, index: number) => (
              <button
                key={story.id}
                onClick={() => handleStoryClick(index)}
                className="relative aspect-[9/16] rounded-lg overflow-hidden bg-dark-3 hover:opacity-80 transition-opacity group"
              >
                {story.media_type === 'video' ? (
                  <>
                    <video
                      src={story.media_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute top-2 right-2">
                      <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={story.media_url}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-[10px]">
                    {new Date(story.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showViewer && storyGroup.length > 0 && (
        <StoryViewer
          storyGroups={storyGroup}
          initialGroupIndex={0}
          currentUserId={user?.id || ''}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
}

export default function StoriesPage() {
  return (
    <AppLayout>
      <StoriesArchivePage />
    </AppLayout>
  );
}
