"use client";

import { useState } from "react";
import { useGetReelsFeed } from "@/lib/react-query/queriesAndMutations";
import Loader from "@/components/shared/Loader";
import ReelViewer from "@/components/shared/ReelViewer";
import Link from "next/link";

const Reels = () => {
  const { data: reels, isPending: isLoading, isError } = useGetReelsFeed();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (isError) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4">
        <p className="text-light-4">Something went wrong loading reels.</p>
      </div>
    );
  }

  // If viewing a reel in full-screen mode
  if (selectedIndex !== null && reels && reels.length > 0) {
    return (
      <ReelViewer
        reels={reels}
        initialIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    );
  }

  return (
    <div className="reels-container">
      <div className="reels-inner">
        <div className="flex items-center justify-between w-full mb-6">
          <h2 className="h3-bold md:h2-bold text-left">Reels</h2>
          <Link
            href="/create-reel"
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Reel
          </Link>
        </div>

        {isLoading ? (
          <div className="flex-center w-full py-20">
            <Loader />
          </div>
        ) : reels && reels.length > 0 ? (
          <div className="reels-grid">
            {reels.map((reel: any, index: number) => (
              <div
                key={reel.id}
                className="reel-thumbnail-card group"
                onClick={() => setSelectedIndex(index)}
              >
                {/* Video thumbnail */}
                <div className="reel-thumbnail-wrapper">
                  <video
                    src={reel.video_url}
                    className="reel-thumbnail-video"
                    muted
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => {
                      (e.target as HTMLVideoElement).play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.pause();
                      video.currentTime = 0;
                    }}
                  />

                  {/* Overlay gradient */}
                  <div className="reel-thumbnail-overlay" />

                  {/* Play icon */}
                  <div className="reel-thumbnail-play">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="white" opacity="0.9">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>

                  {/* Views count */}
                  <div className="reel-thumbnail-views">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                    <span>{reel.view_count || 0}</span>
                  </div>

                  {/* Likes count */}
                  <div className="reel-thumbnail-likes">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{reel._count?.likes || 0}</span>
                  </div>
                </div>

                {/* Creator info */}
                <div className="reel-thumbnail-info">
                  <img
                    src={reel.creator?.image_url || "/assets/icons/profile-placeholder.svg"}
                    alt={reel.creator?.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-white text-xs font-medium truncate">
                    {reel.creator?.username || reel.creator?.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-dark-3 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-light-4">
                <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
                <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
                <polygon points="10,12 10,19 16,15.5" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="text-light-2 text-lg font-semibold mb-2">No reels yet</h3>
            <p className="text-light-4 text-sm mb-4 max-w-sm">
              Be the first to create a reel! Share short videos with your followers.
            </p>
            <Link
              href="/create-reel"
              className="text-primary-500 hover:text-primary-400 text-sm font-medium"
            >
              Create your first reel →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reels;
