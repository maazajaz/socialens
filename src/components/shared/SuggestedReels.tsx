"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetReelsFeed } from "@/lib/react-query/queriesAndMutations";
import ReelViewer from "./ReelViewer";

const SuggestedReels = () => {
  const { data: reels, isPending: isLoading } = useGetReelsFeed();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Don't render if no reels or still loading
  if (isLoading || !reels || reels.length === 0) return null;

  // Show max 6 reels in the suggestion strip
  const displayReels = reels.slice(0, 6);

  // If viewing a reel in full-screen mode
  if (selectedIndex !== null) {
    return (
      <ReelViewer
        reels={reels}
        initialIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    );
  }

  return (
    <div className="home-reels-suggestion">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary-500">
            <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
            <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
            <polygon points="10,12 10,19 16,15.5" fill="currentColor"/>
          </svg>
          <h3 className="text-white font-semibold text-base">Suggested Reels</h3>
        </div>
        <Link
          href="/reels"
          className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
        >
          See All
        </Link>
      </div>

      <div className="home-reels-scroll">
        {displayReels.map((reel: any, index: number) => (
          <div
            key={reel.id}
            className="home-reel-mini group"
            onClick={() => setSelectedIndex(index)}
          >
            <video
              src={reel.video_url}
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
            <div className="home-reel-mini-overlay" />
            
            {/* Creator info at bottom */}
            <div className="home-reel-mini-info">
              <img
                src={reel.creator?.image_url || "/assets/icons/profile-placeholder.svg"}
                alt=""
                className="w-5 h-5 rounded-full object-cover border border-white/30"
              />
              <span className="text-white text-[10px] font-medium truncate">
                {reel.creator?.username}
              </span>
            </div>

            {/* Play button overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" opacity="0.8">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedReels;
