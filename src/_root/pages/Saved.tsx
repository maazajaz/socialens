"use client";

import { useEffect } from "react";
import { useGetCurrentUser, useGetSavedPosts } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/SupabaseAuthContext";
import Loader from "@/components/shared/Loader";
import GridPostList from "@/components/shared/GridPostList";

const Saved = () => {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useUserContext();
  const { data: currentUser } = useGetCurrentUser();
  const { data: savedPosts, isLoading: isLoadingSaved } = useGetSavedPosts(currentUser?.id);

  // Debug: Log authentication state for troubleshooting
  useEffect(() => {
    console.log('💾 SAVED AUTH DEBUG:', {
      user: user?.id || 'no-user',
      isLoading: isAuthLoading,
      isAuthenticated,
      currentUser: currentUser?.id || 'no-current-user',
      timestamp: new Date().toISOString()
    });
  }, [user, isAuthLoading, isAuthenticated, currentUser]);

  if (!currentUser) {
    return <Loader />;
  }

  return (
    <div className="saved-container">
      <div className="flex gap-2 w-full max-w-5xl">
        <img
          src="/assets/icons/save.svg"
          width={36}
          height={36}
          alt="edit"
          className="invert-white"
        />
        <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
      </div>

      {isLoadingSaved ? (
        <Loader />
      ) : (
        <ul className="w-full flex justify-center max-w-5xl gap-9">
          {!savedPosts || savedPosts.length === 0 ? (
            <p className="text-light-4">No saved posts yet</p>
          ) : (
            <GridPostList posts={savedPosts} showStats={false} />
          )}
        </ul>
      )}
    </div>
  );
};

export default Saved;
