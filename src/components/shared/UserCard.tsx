import Link from "next/link";
import { Button } from "../ui/button";
import { useIsFollowing, useFollowUser, useUnfollowUser } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/SupabaseAuthContext";

type UserCardProps = {
  user: any; // TODO: Add proper Supabase user type
};

const UserCard = ({ user }: UserCardProps) => {
  const { user: currentUser } = useUserContext();
  const { data: isCurrentlyFollowing, isLoading: isFollowingLoading } = useIsFollowing(user.id);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  
  const handleFollowToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    e.stopPropagation();
    
    if (isCurrentlyFollowing) {
      unfollowMutation.mutate(user.id);
    } else {
      followMutation.mutate(user.id);
    }
  };

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <Link href={`/profile/${user.id}`} className="user-card">
      <img
        src={user.image_url || "/assets/icons/profile-placeholder.svg"}
        alt="creator"
        className="rounded-full w-14 h-14"
      />

      <div className="flex-center flex-col gap-1">
        <p className="base-medium text-light-1 text-center line-clamp-1">
          {user.name}
        </p>
        <p className="small-regular text-light-3 text-center line-clamp-1">
          @{user.username}
        </p>
      </div>

      {!isOwnProfile && (
        <Button 
          type="button" 
          size="sm" 
          className={`px-5 ${
            isCurrentlyFollowing 
              ? "bg-dark-4 hover:bg-dark-3 text-light-1" 
              : "shad-button_primary"
          }`}
          onClick={handleFollowToggle}
          disabled={followMutation.isPending || unfollowMutation.isPending || isFollowingLoading}
        >
          {followMutation.isPending || unfollowMutation.isPending 
            ? "Loading..." 
            : isCurrentlyFollowing 
              ? "Following" 
              : "Follow"
          }
        </Button>
      )}
    </Link>
  );
};

export default UserCard;
