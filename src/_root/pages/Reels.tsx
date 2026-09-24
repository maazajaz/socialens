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


  return (
    <div className="flex flex-col flex-1 h-screen bg-black">
      {isLoading ? (
        <div className="flex-center w-full h-full">
          <Loader />
        </div>
      ) : reels && reels.length > 0 ? (
        <ReelViewer reels={reels} initialIndex={0} isModal={false} />
      ) : (
        <div className="flex flex-col flex-1 items-center justify-center text-center p-5">
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
  );
};

export default Reels;
