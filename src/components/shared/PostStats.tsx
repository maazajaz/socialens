import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
  useDeleteLike,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from "@/lib/react-query/queriesAndMutations";

type PostStatsProps = {
  post: any; // Updated from Models.Document to any for Supabase compatibility
  userId: string;
  onCommentClick?: () => void;
};

const PostStats = ({ post, userId, onCommentClick }: PostStatsProps) => {
  const location = useLocation();
  
  // Handle both Appwrite and Supabase post structures
  const likesList = post.likes ? post.likes.map((like: any) => {
    // Supabase structure: {user_id: string}
    if (like.user_id) return like.user_id;
    // Appwrite structure: {$id: string} or direct string
    return like.id || like.$id || like;
  }) : [];

  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);

  const { mutate: likePost } = useLikePost();
  const { mutate: deleteLike } = useDeleteLike();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();

  const { data: currentUser } = useGetCurrentUser();

  // Check if post is saved - updated for Supabase structure
  useEffect(() => {
    const checkIfSaved = async () => {
      if (currentUser?.id && post?.id) {
        try {
          // Check if this post is in the saves table for this user
          const savedPosts = post.saves || [];
          const isCurrentUserSaved = savedPosts.some((save: any) => 
            save.user_id === currentUser.id
          );
          setIsSaved(isCurrentUserSaved);
        } catch (error) {
          console.error('Error checking saved state:', error);
          setIsSaved(false);
        }
      }
    };
    
    checkIfSaved();
  }, [currentUser, post.id, post.saves]);

  const handleLikePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    const postId = post.id || post.$id;
    let likesArray = [...likes];

    if (likesArray.includes(userId)) {
      // Unlike the post
      likesArray = likesArray.filter((Id) => Id !== userId);
      setLikes(likesArray);
      deleteLike({ postId, userId });
    } else {
      // Like the post
      likesArray.push(userId);
      setLikes(likesArray);
      likePost({ postId, userId });
    }
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    const postId = post.id || post.$id;
    
    if (isSaved) {
      // If currently saved, unsave it
      setIsSaved(false);
      return deleteSavePost({ postId, userId });
    }

    // If not saved, save it
    savePost({ userId: userId, postId: postId });
    setIsSaved(true);
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  return (
    <div
      className={`flex justify-between items-center z-20 ${containerStyles}`}>
      <div className="flex gap-4 mr-5">
        {/* Like Button */}
        <div className="flex gap-2 items-center">
          <img
            src={`${
              checkIsLiked(likes, userId)
                ? "/assets/icons/liked.svg"
                : "/assets/icons/like.svg"
            }`}
            alt="like"
            width={20}
            height={20}
            onClick={(e) => handleLikePost(e)}
            className="cursor-pointer"
          />
          <p className="small-medium lg:base-medium">{likes.length}</p>
        </div>

        {/* Comments Button */}
        <div className="flex gap-2 items-center">
          <img
            src="/assets/icons/chat.svg"
            alt="comment"
            width={20}
            height={20}
            className="cursor-pointer"
            onClick={onCommentClick}
          />
          <p className="small-medium lg:base-medium">
            {post._count?.comments || 0}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          alt="share"
          width={20}
          height={20}
          className="cursor-pointer"
          onClick={(e) => handleSavePost(e)}
        />
      </div>
    </div>
  );
};

export default PostStats;
