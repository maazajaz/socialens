"use client";

import { useState, useEffect } from "react";
import { getPostComments, Comment } from "@/lib/supabase/api";
import { useUserContext } from "@/context/SupabaseAuthContext";
import CommentForm from "@/components/forms/CommentForm";
import CommentItem from "@/components/shared/CommentItem";
import Loader from "@/components/shared/Loader";

type CommentsProps = {
  postId: string;
  className?: string;
};

const Comments = ({ postId, className = "" }: CommentsProps) => {
  const { user } = useUserContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsCount, setCommentsCount] = useState(0);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const fetchedComments = await getPostComments(postId);
      setComments(fetchedComments);
      setCommentsCount(fetchedComments.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleCommentCreated = () => {
    fetchComments(); // Refresh comments after new comment
  };

  const handleCommentUpdated = () => {
    fetchComments(); // Refresh comments after update/delete
  };

  return (
    <div className={`comments-section ${className}`}>
      {/* Comments Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-light-1">
          {commentsCount === 0 
            ? "No comments yet" 
            : `${commentsCount} ${commentsCount === 1 ? "comment" : "comments"}`
          }
        </h3>
      </div>

      {/* Comment Form */}
      {user && (
        <div className="mb-6">
          <CommentForm 
            postId={postId} 
            onCommentCreated={handleCommentCreated}
            placeholder="Add a comment..."
          />
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onCommentUpdated={handleCommentUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-light-4">
          <p>Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default Comments;
