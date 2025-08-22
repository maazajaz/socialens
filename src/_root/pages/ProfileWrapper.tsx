"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { 
  useGetUserById, 
  useGetUserPosts, 
  useGetFollowersCount, 
  useGetFollowingCount,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser
} from "@/lib/react-query/queriesAndMutations";
import Loader from "@/components/shared/Loader";
import GridPostList from "@/components/shared/GridPostList";
import LinkifiedText from "@/components/shared/LinkifiedText";
import LikedPosts from "./LikedPosts";

interface StabBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

type ProfileWrapperProps = {
  params: { id: string };
};

const ProfileWrapper = ({ params }: ProfileWrapperProps) => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  
  // Get id from params
  const id = params?.id;
  
  console.log('ProfileWrapper params debug:', {
    params,
    paramsId: params?.id,
    id,
    paramsType: typeof params,
    paramsKeys: params ? Object.keys(params) : 'no params'
  });

  const { data: currentUser, isPending: isUserLoading, error: userError } = useGetUserById(id || "");
  const { data: userPosts, isPending: isPostsLoading } = useGetUserPosts(id || "");
  
  // Follow functionality
  const { data: followersCount, isLoading: followersLoading } = useGetFollowersCount(id || "");
  const { data: followingCount, isLoading: followingLoading } = useGetFollowingCount(id || "");
  const { data: isCurrentlyFollowing, isLoading: isFollowingLoading } = useIsFollowing(id || "");
  
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  // Debug logging
  console.log('ProfileWrapper Debug:', {
    id,
    currentUser: currentUser?.name || 'No user',
    userPosts: userPosts?.length || 0,
    isPostsLoading,
    isUserLoading,
    userError: userError ? 'Error loading user' : 'No error',
    followersCount,
    followingCount,
    user: user?.name || 'No current user'
  });
  
  const handleFollowToggle = () => {
    if (!id) return;
    
    if (isCurrentlyFollowing) {
      unfollowMutation.mutate(id);
    } else {
      followMutation.mutate(id);
    }
  };
  
  const isOwnProfile = user?.id === id;

  if (isUserLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-1">Error loading user profile</p>
      </div>
    );
  }

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-1">User not found</p>
      </div>
    );

  return (
    <div className="profile-container">
      <div className="flex items-start gap-8 flex-row relative max-w-5xl w-full mb-8">
        <img
          src={
            currentUser.image_url || "/assets/icons/profile-placeholder.svg"
          }
          alt="profile"
          className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-full flex-shrink-0"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex flex-col">
              <h1 className="text-left text-2xl sm:text-3xl md:text-4xl font-bold">
                {currentUser.name}
              </h1>
              <p className="text-sm sm:text-base text-light-3 text-left mt-1">
                @{currentUser.username}
              </p>
            </div>
            
            <div className="ml-4">
              <div className={`${isOwnProfile && "hidden"}`}>
                <Button
                  type="button"
                  className={`h-10 px-4 text-light-1 flex-center gap-2 rounded-lg ${
                    isCurrentlyFollowing 
                      ? "bg-dark-4 hover:bg-dark-3" 
                      : "bg-primary-500 hover:bg-primary-600"
                  }`}
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending || isFollowingLoading}
                >
                  <p className="flex whitespace-nowrap small-medium">
                    {followMutation.isPending || unfollowMutation.isPending 
                      ? "Loading..." 
                      : isCurrentlyFollowing 
                        ? "Unfollow" 
                        : "Follow"
                    }
                  </p>
                </Button>
              </div>
              
              <div className={`${!isOwnProfile && "hidden"}`}>
                <Link
                  href={`/update-profile/${currentUser.id}`}
                  className="h-10 bg-dark-4 px-4 text-light-1 flex-center gap-2 rounded-lg hover:bg-dark-3"
                >
                  <img
                    src={"/assets/icons/edit.svg"}
                    alt="edit"
                    width={16}
                    height={16}
                  />
                  <p className="flex whitespace-nowrap small-medium">
                    Edit Profile
                  </p>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex gap-4 sm:gap-6 md:gap-8 mb-4 items-center justify-start flex-wrap">
            <StatBlock value={isPostsLoading ? "..." : userPosts?.length || 0} label="Posts" />
            <StatBlock value={followersLoading ? "..." : followersCount || 0} label="Followers" />
            <StatBlock value={followingLoading ? "..." : followingCount || 0} label="Following" />
          </div>

          <LinkifiedText 
            text={currentUser.bio || ""}
            className="text-sm sm:text-base text-left max-w-none sm:max-w-md mb-4"
          />
        </div>
      </div>

      {currentUser.id === user?.id && (
        <div className="flex max-w-5xl w-full mt-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`profile-tab rounded-l-lg ${
              activeTab === 'posts' && "!bg-dark-3"
            }`}
          >
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`profile-tab rounded-r-lg ${
              activeTab === 'liked' && "!bg-dark-3"
            }`}
          >
            <img
              src={"/assets/icons/like.svg"}
              alt="like"
              width={20}
              height={20}
            />
            Liked Posts
          </button>
        </div>
      )}

      <div className="mt-8">
        {activeTab === 'posts' ? (
          <GridPostList posts={userPosts || []} showUser={false} />
        ) : (
          currentUser.id === user?.id && <LikedPosts />
        )}
      </div>
    </div>
  );
};

export default ProfileWrapper;