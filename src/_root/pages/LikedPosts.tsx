
"use client";

import GridPostList from "@/components/shared/GridPostList";
import Loader from "@/components/shared/Loader";
import { useGetLikedPosts } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/SupabaseAuthContext";

const LikedPosts = () => {
  const { user } = useUserContext();
  const { data: likedPosts, isPending } = useGetLikedPosts(user?.id);

  if (isPending)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <>
      {!likedPosts || likedPosts.length === 0 ? (
        <p className="text-light-4">No liked posts</p>
      ) : (
        <GridPostList posts={likedPosts} showStats={false} />
      )}
    </>
  );
};

export default LikedPosts;
