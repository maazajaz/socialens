import {
    Route,
    Routes,
    Link,
    Outlet,
    useParams,
    useLocation,
  } from "react-router-dom";
  
import { Button } from "@/components/ui";
import { LikedPosts } from "@/_root/pages";
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
  
const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();

  const { data: currentUser } = useGetUserById(id || "");
  const { data: userPosts, isPending: isPostsLoading } = useGetUserPosts(id || "");
  
  // Follow functionality
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
  
  const isOwnProfile = user?.id === id;    if (!currentUser)
      return (
        <div className="flex-center w-full h-full">
          <Loader />
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
                    disabled={followMutation.isPending || unfollowMutation.isPending}
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
                    to={`/update-profile/${currentUser.id}`}
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
            <Link
              to={`/profile/${id}`}
              className={`profile-tab rounded-l-lg ${
                pathname === `/profile/${id}` && "!bg-dark-3"
              }`}>
              <img
                src={"/assets/icons/posts.svg"}
                alt="posts"
                width={20}
                height={20}
              />
              Posts
            </Link>
            <Link
              to={`/profile/${id}/liked-posts`}
              className={`profile-tab rounded-r-lg ${
                pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
              }`}>
              <img
                src={"/assets/icons/like.svg"}
                alt="like"
                width={20}
                height={20}
              />
              Liked Posts
            </Link>
          </div>
        )}

        <Routes>
          <Route
            index
            element={<GridPostList posts={userPosts || []} showUser={false} />}
          />
          {currentUser.id === user?.id && (
            <Route path="/liked-posts" element={<LikedPosts />} />
          )}
        </Routes>
        <Outlet />
      </div>
    );
    };
  
  export default Profile;
  