"use client";

import { useState } from "react";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { Comment, likeComment, unlikeComment, deleteComment, getCommentLikeStatus } from "@/lib/supabase/api";
import { multiFormatDateString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CommentForm from "@/components/forms/CommentForm";
import Image from "next/image";
import Link from "next/link";

type CommentItemProps = {
  comment: Comment;
  onCommentUpdated?: () => void;
  level?: number;
};

const CommentItem = ({ comment, onCommentUpdated, level = 0 }: CommentItemProps) => {
  const { user } = useUserContext();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment._count?.likes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user has liked this comment
  useState(() => {
    if (user && comment.id) {
      getCommentLikeStatus(comment.id, user.id).then(setIsLiked);
    }
  });

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        const success = await unlikeComment(comment.id, user.id);
        if (success) {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const success = await likeComment(comment.id, user.id);
        if (success) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== comment.user_id || isDeleting) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    setIsDeleting(true);
    try {
      const success = await deleteComment(comment.id);
      if (success) {
        onCommentUpdated?.();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplyCreated = () => {
    setShowReplyForm(false);
    setShowReplies(true);
    onCommentUpdated?.();
  };

  const isOwner = user?.id === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment._count?.replies || 0;

  return (
    <div className={`flex gap-3 ${level > 0 ? 'ml-8' : ''}`}>
      {/* User Avatar */}
      <Link href={`/profile/${comment.user.id}`}>
        <Image
          src={comment.user.image_url || "/assets/icons/profile-placeholder.svg"}
          alt={comment.user.name}
          width={level > 0 ? 28 : 32}
          height={level > 0 ? 28 : 32}
          className="rounded-full"
        />
      </Link>

      <div className="flex-1">
        {/* Comment Content */}
        <div className="bg-dark-4 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href={`/profile/${comment.user.id}`}
              className="text-sm font-medium text-light-1 hover:text-primary-500"
            >
              {comment.user.name}
            </Link>
            <span className="text-xs text-light-4">
              @{comment.user.username}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-light-4">• edited</span>
            )}
          </div>
          
          <p className="text-sm text-light-2 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 mt-2 mb-2">
          <span className="text-xs text-light-4">
            {multiFormatDateString(comment.created_at)}
          </span>

          {likesCount > 0 && (
            <span className="text-xs text-light-4">
              {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!user || isLiking}
            className="text-xs text-light-4 hover:text-primary-500 px-1 py-0 h-auto"
          >
            {isLiked ? "Unlike" : "Like"}
          </Button>

          {level === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-light-4 hover:text-primary-500 px-1 py-0 h-auto"
            >
              Reply
            </Button>
          )}

          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-red-500 hover:text-red-400 px-1 py-0 h-auto"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && level === 0 && (
          <div className="mt-2">
            <CommentForm
              postId={comment.post_id}
              parentId={comment.id}
              onCommentCreated={handleReplyCreated}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.user.name}...`}
              autoFocus
            />
          </div>
        )}

        {/* Show/Hide Replies Button */}
        {hasReplies && level === 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-primary-500 hover:text-primary-400 px-1 py-1 h-auto mb-2"
          >
            {showReplies ? "Hide" : "View"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </Button>
        )}

        {/* Replies */}
        {showReplies && hasReplies && level === 0 && (
          <div className="mt-2 space-y-3">
            {comment.replies?.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onCommentUpdated={onCommentUpdated}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
