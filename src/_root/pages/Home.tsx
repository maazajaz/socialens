"use client";

// import { useToast } from "@/components/ui/use-toast";

import { useGetRecentPosts, useGetUsers } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/SupabaseAuthContext";
import Loader from "@/components/shared/Loader";
import PostCard from "@/components/shared/PostCard";
import UserCard from "@/components/shared/UserCard";

const Home = () => {
  // const { toast } = useToast();
  const { user } = useUserContext();

  const {
    data: posts,
    isPending: isPostLoading,
    isError: isErrorPosts,
  } = useGetRecentPosts();
  const {
    data: creators,
    isPending: isUserLoading,
    isError: isErrorCreators,
  } = useGetUsers(10);

  // Filter out current user from creators list
  const otherUsers = creators?.filter((creator: any) => creator.id !== user?.id) || [];

  if (isErrorPosts || isErrorCreators) {
    return (
      <div className="flex flex-1">
        <div className="home-container">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
        <div className="home-creators">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-1 w-full">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {isPostLoading && !posts ? (
            <Loader />
          ) : (
            <ul className="flex flex-col flex-1 gap-9 w-full ">
              {posts && posts.length > 0 ? (
                posts.map((post: any) => (
                  <li key={post.id} className="flex justify-center w-full">
                    <PostCard post={post} />
                  </li>
                ))
              ) : (
                <p className="text-light-4">No posts yet</p>
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="home-creators">
        <h3 className="h3-bold text-light-1">People You Might Know</h3>
        {isUserLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="grid 2xl:grid-cols-2 gap-6">
            {otherUsers && otherUsers.length > 0 ? (
              otherUsers.map((creator: any) => (
                <li key={creator?.id}>
                  <UserCard user={creator} />
                </li>
              ))
            ) : (
              <p className="text-light-4">No other users yet</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
