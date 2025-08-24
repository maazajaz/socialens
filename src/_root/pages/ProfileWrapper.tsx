
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/SupabaseAuthContext";
import ShareProfileModal from "@/components/shared/ShareProfileModal";
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
import PrivacySettings from "@/components/shared/PrivacySettings";

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
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  
  const id = params?.id;

  const { data: currentUser, isPending: isUserLoading, error: userError } = useGetUserById(id || "");
  const { data: userPosts, isPending: isPostsLoading } = useGetUserPosts(id || "");
  
  const { data: followersCount, isLoading: followersLoading } = useGetFollowersCount(id || "");
  const { data: followingCount, isLoading: followingLoading } = useGetFollowingCount(id || "");
  const { data: isCurrentlyFollowing, isLoading: isFollowingLoading } = useIsFollowing(id || "");
  
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  
  const handleFollowToggle = () => {
    if (!id) return;
    
    if (isCurrentlyFollowing) {
      unfollowMutation.mutate(id);
    } else {
      followMutation.mutate(id);
    }
  };

  const [showShareModal, setShowShareModal] = useState(false);
  const handleShareProfile = () => {
    setShowShareModal(true);
  };
  
  const isOwnProfile = user?.id === id;

  if (isUserLoading) {
    return <div className="flex-center w-full h-full"><Loader /></div>;
  }
  if (userError) {
    return <div className="flex-center w-full h-full"><p className="text-light-1">Error loading user profile</p></div>;
  }
  if (!currentUser) {
    return <div className="flex-center w-full h-full"><p className="text-light-1">User not found</p></div>;
  }

  // ACTION BUTTONS - GAP REDUCED
  const ActionButtons = () => (
    <div className="flex gap-2 w-full mt-3"> {/* CHANGED: mt-4 to mt-3 */}
      {isOwnProfile ? (
        <>
          <Link
            href={`/update-profile/${currentUser.id}`}
            className="h-10 bg-dark-4 px-4 text-light-1 flex-center gap-2 rounded-lg hover:bg-dark-3 flex-1"
          >
            <p className="flex whitespace-nowrap small-medium">Edit Profile</p>
          </Link>
          <Button 
            type="button" 
            className="h-10 bg-dark-4 px-4 text-light-1 rounded-lg hover:bg-dark-3 flex-1 flex items-center justify-center gap-2" 
            onClick={() => setShowPrivacySettings(!showPrivacySettings)}
          >
            <img 
              src="/assets/icons/profile-placeholder.svg" 
              alt="settings" 
              width={16} 
              height={16} 
              className="invert-white"
            />
            <p className="flex whitespace-nowrap small-medium">Settings</p>
          </Button>
          <Button type="button" className="h-10 bg-dark-4 px-4 text-light-1 rounded-lg hover:bg-dark-3 flex-1" onClick={handleShareProfile}>
            <p className="flex whitespace-nowrap small-medium">Share Profile</p>
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            className={`h-10 px-4 text-light-1 flex-center gap-2 rounded-lg flex-1 ${
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
                  ? "Following" 
                  : "Follow"
              }
            </p>
          </Button>
          <Button type="button" className="h-10 bg-dark-4 px-4 text-light-1 rounded-lg hover:bg-dark-3 flex-1" onClick={handleShareProfile}>
            <p className="flex whitespace-nowrap small-medium">Share Profile</p>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="profile-container">
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={currentUser}
      />
      <div className="flex flex-col w-full max-w-5xl">
        {/* MAIN HEADER - ALIGNMENT CHANGED */}
        <div className="flex flex-row items-center gap-4 sm:gap-6 w-full"> {/* CHANGED: items-start to items-center */}
          <img
            src={currentUser.image_url || "/assets/icons/profile-placeholder.svg"}
            alt="profile"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex-shrink-0"
          />
          <div className="flex flex-col items-start w-full">
            <h1 className="text-left text-xl sm:text-2xl font-bold">
              {currentUser.name}
            </h1>
            <p className="text-sm text-light-3 text-left">
              @{currentUser.username}
            </p>

            <div className="flex gap-4 sm:gap-6 mt-3">
              <StatBlock value={isPostsLoading ? "..." : userPosts?.length || 0} label="Posts" />
              <StatBlock value={followersLoading ? "..." : followersCount || 0} label="Followers" />
              <StatBlock value={followingLoading ? "..." : followingCount || 0} label="Following" />
            </div>
          </div>
        </div>
        
        {/* BIO - GAP REDUCED */}
        <div className="mt-2 w-full"> {/* CHANGED: mt-3 to mt-2 */}
            <LinkifiedText 
              text={currentUser.bio || ""}
              className="text-sm text-left"
            />
        </div>

        <ActionButtons />
      </div>

      {/* Privacy Settings Component */}
      {isOwnProfile && showPrivacySettings && (
        <div className="mt-6 mb-4 px-4 animate-in slide-in-from-top-2 duration-300">
          <PrivacySettings 
            currentPrivacy={currentUser.privacy_setting || 'public'}
            userId={currentUser.id}
            onClose={() => setShowPrivacySettings(false)}
          />
        </div>
      )}
      
      {/* POSTS TABS - GAP REDUCED */}
      <div className="flex border-t border-dark-4 w-full max-w-5xl mt-2 pt-2"> {/* CHANGED: mt-3 pt-2 to mt-2 pt-2 */}
        {currentUser.id === user?.id && (
          <div className="flex max-w-5xl w-full">
            <button
              onClick={() => setActiveTab('posts')}
              className={`profile-tab rounded-l-lg ${
                activeTab === 'posts' && "!bg-dark-3"
              }`}
            >
              <img src={"/assets/icons/posts.svg"} alt="posts" width={20} height={20} />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`profile-tab rounded-r-lg ${
                activeTab === 'liked' && "!bg-dark-3"
              }`}
            >
              <img src={"/assets/icons/like.svg"} alt="like" width={20} height={20} />
              Liked Posts
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-5xl mt-4">
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