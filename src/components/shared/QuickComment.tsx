"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { 
  createComment, 
  getPostComments, 
  Comment, 
  likeComment, 
  unlikeComment, 
  getCommentLikeStatus,
  updateComment,
  deleteComment
} from "@/lib/supabase/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { multiFormatDateString } from "@/lib/utils";
import AuthPromptModal from "./AuthPromptModal";
import Link from "next/link";

type QuickCommentProps = {
  postId: string;
  onCommentAdded?: () => void;
};

const QuickComment = ({ postId, onCommentAdded }: QuickCommentProps) => {
  const { user } = useUserContext();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authAction, setAuthAction] = useState("");

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Load like statuses for comments when user is available
  useEffect(() => {
    if (user && comments.length > 0) {
      loadLikeStatuses();
    }
  }, [user, comments]);

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const fetchedComments = await getPostComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadLikeStatuses = async () => {
    if (!user) return;
    
    const likedSet = new Set<string>();
    
    // Check like status for all comments and their replies
    for (const comment of comments) {
      const isLiked = await getCommentLikeStatus(comment.id, user.id);
      if (isLiked) likedSet.add(comment.id);
      
      // Check replies too
      if (comment.replies) {
        for (const reply of comment.replies) {
          const isReplyLiked = await getCommentLikeStatus(reply.id, user.id);
          if (isReplyLiked) likedSet.add(reply.id);
        }
      }
    }
    
    setLikedComments(likedSet);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      setAuthAction("like comments");
      setShowAuthPrompt(true);
      return;
    }
    
    const isLiked = likedComments.has(commentId);
    
    try {
      if (isLiked) {
        const success = await unlikeComment(commentId, user.id);
        if (success) {
          setLikedComments(prev => {
            const newSet = new Set(prev);
            newSet.delete(commentId);
            return newSet;
          });
          // Refresh comments to update counts
          await fetchComments();
        }
      } else {
        const success = await likeComment(commentId, user.id);
        if (success) {
          setLikedComments(prev => new Set([...prev, commentId]));
          // Refresh comments to update counts
          await fetchComments();
        }
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      setAuthAction("reply to comments");
      setShowAuthPrompt(true);
      return;
    }
    
    if (!replyContent.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    
    try {
      const reply = await createComment({
        content: replyContent.trim(),
        postId,
        userId: user.id,
        parentId: parentId,
      });

      if (reply) {
        setReplyContent("");
        setReplyingTo(null);
        // Refresh comments to show the new reply
        await fetchComments();
        onCommentAdded?.();
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingComment(commentId);
    setEditContent(currentContent);
    setReplyingTo(null); // Close any open reply forms
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim() || !user || isUpdatingComment) return;

    setIsUpdatingComment(true);
    
    try {
      const updatedComment = await updateComment(commentId, editContent.trim());
      
      if (updatedComment) {
        setEditingComment(null);
        setEditContent("");
        // Refresh comments to show the updated content
        await fetchComments();
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
    if (!confirmDelete) return;
    
    try {
      const success = await deleteComment(commentId);
      
      if (success) {
        // Refresh comments to remove the deleted one
        await fetchComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setAuthAction("comment on posts");
      setShowAuthPrompt(true);
      return;
    }
    
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const newComment = await createComment({
        content: comment.trim(),
        postId,
        userId: user.id,
      });

      if (newComment) {
        setComment("");
        // Refresh comments to show the new one
        await fetchComments();
        onCommentAdded?.();
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display logic: show first 5 comments, or all if showAllComments is true
  const displayedComments = showAllComments ? comments : comments.slice(0, 5);
  const hasMoreComments = comments.length > 5;

  return (
    <div className="space-y-4">
      {/* Comment Form - Only show if user is authenticated */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 p-3">
          <img
            src={user.image_url || "/assets/icons/profile-placeholder.svg"}
            alt="Your profile"
            width={32}
            height={32}
            className="rounded-full"
          />
          
          <div className="flex-1 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border rounded-full px-4 py-2 bg-dark-4 border-dark-4 text-light-1 placeholder:text-light-4 focus:border-primary-500"
              maxLength={2200}
              disabled={isSubmitting}
            />
          
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={!comment.trim() || isSubmitting}
            className="text-primary-500 hover:text-primary-600 disabled:text-light-4 px-3 py-2 font-semibold"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
      ) : (
        /* Auth prompt for unauthenticated users */
        <div className="flex items-center gap-3 p-3 bg-dark-4 rounded-lg">
          <img
            src="/assets/icons/profile-placeholder.svg"
            alt="Guest profile"
            width={32}
            height={32}
            className="rounded-full opacity-50"
          />
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Sign in to add a comment..."
              className="flex-1 border rounded-full px-4 py-2 bg-dark-3 border-dark-3 text-light-1 placeholder:text-light-3 cursor-pointer"
              readOnly
              onClick={() => {
                setAuthAction("comment on posts");
                setShowAuthPrompt(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Comments Display - Always visible */}
      <div className="px-3 space-y-3">
        {isLoadingComments ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-light-4 text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            {/* Comments List */}
            <div className={`space-y-3 ${hasMoreComments && !showAllComments ? 'max-h-80 overflow-hidden' : showAllComments ? 'max-h-96 overflow-y-auto' : ''}`}>
              {displayedComments.map((commentItem) => (
                <div key={commentItem.id} className="flex gap-3">
                  {/* User Avatar */}
                  <Link href={`/profile/${commentItem.user.id}`}>
                    <img
                      src={commentItem.user.image_url || "/assets/icons/profile-placeholder.svg"}
                      alt={commentItem.user.name}
                      width={28}
                      height={28}
                      className="rounded-full mt-1"
                    />
                  </Link>

                  <div className="flex-1">
                    {/* Comment Content */}
                    <div className="bg-dark-4 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/profile/${commentItem.user.id}`}
                          className="text-sm font-medium text-light-1 hover:text-primary-500"
                        >
                          {commentItem.user.name}
                        </Link>
                        <span className="text-xs text-light-4">
                          @{commentItem.user.username}
                        </span>
                        {commentItem.is_edited && (
                          <span className="text-xs text-light-4">• edited</span>
                        )}
                      </div>
                      
                      {/* Comment Content - Edit Mode */}
                      {editingComment === commentItem.id ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs bg-dark-3 border-dark-3 text-light-1 placeholder:text-light-4 focus:border-primary-500"
                            maxLength={2200}
                            disabled={isUpdatingComment}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUpdateComment(commentItem.id);
                              }
                              if (e.key === 'Escape') {
                                cancelEdit();
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm" 
                              onClick={() => handleUpdateComment(commentItem.id)}
                              disabled={isUpdatingComment || !editContent.trim()}
                              className="text-xs px-2 py-1 h-6 bg-primary-500 text-white hover:bg-primary-600 disabled:bg-dark-3"
                            >
                              {isUpdatingComment ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="text-xs px-2 py-1 h-6 text-light-4 hover:text-light-2"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-light-2 whitespace-pre-wrap break-words">
                          {commentItem.content}
                        </p>
                      )}
                    </div>

                    {/* Comment Meta */}
                    <div className="flex items-center gap-4 mt-1 mb-2">
                      <span className="text-xs text-light-4">
                        {multiFormatDateString(commentItem.created_at)}
                      </span>

                      {commentItem._count?.likes && commentItem._count.likes > 0 && (
                        <span className="text-xs text-light-4">
                          {commentItem._count.likes} {commentItem._count.likes === 1 ? 'like' : 'likes'}
                        </span>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(commentItem.id)}
                        className={`text-xs px-1 py-0 h-auto ${
                          likedComments.has(commentItem.id) 
                            ? 'text-red-500 hover:text-red-400' 
                            : 'text-light-4 hover:text-primary-500'
                        }`}
                      >
                        {likedComments.has(commentItem.id) ? 'Unlike' : 'Like'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!user) {
                            setAuthAction("reply to comments");
                            setShowAuthPrompt(true);
                            return;
                          }
                          setReplyingTo(replyingTo === commentItem.id ? null : commentItem.id);
                        }}
                        className="text-xs text-light-4 hover:text-primary-500 px-1 py-0 h-auto"
                      >
                        {replyingTo === commentItem.id ? 'Cancel' : 'Reply'}
                      </Button>

                      {/* Edit and Delete buttons - only show if comment belongs to current user */}
                      {user && commentItem.user.id === user.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(commentItem.id, commentItem.content)}
                            className="text-xs text-light-4 hover:text-blue-500 px-1 py-0 h-auto"
                          >
                            Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(commentItem.id)}
                            className="text-xs text-light-4 hover:text-red-500 px-1 py-0 h-auto"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === commentItem.id && (
                      <div className="flex items-center gap-2 mt-2 mb-2">
                        <img
                          src={user?.image_url || "/assets/icons/profile-placeholder.svg"}
                          alt="Your profile"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <Input
                          type="text"
                          placeholder={`Reply to ${commentItem.user.name}...`}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="flex-1 border rounded-full px-3 py-1 text-xs bg-dark-4 border-dark-4 text-light-1 placeholder:text-light-4 focus:border-primary-500"
                          maxLength={2200}
                          disabled={isSubmittingReply}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSubmitReply(commentItem.id);
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSubmitReply(commentItem.id)}
                          disabled={!replyContent.trim() || isSubmittingReply}
                          className="text-xs text-primary-500 hover:text-primary-600 disabled:text-light-4 px-2 py-1"
                        >
                          {isSubmittingReply ? "Posting..." : "Post"}
                        </Button>
                      </div>
                    )}

                    {/* Replies (if any) */}
                    {commentItem.replies && commentItem.replies.length > 0 && (
                      <div className="ml-4 mt-2 space-y-2">
                        {commentItem.replies.slice(0, 2).map((reply) => (
                          <div key={reply.id} className="space-y-1">
                            <div className="flex gap-2">
                              <Link href={`/profile/${reply.user.id}`}>
                                <img
                                  src={reply.user.image_url || "/assets/icons/profile-placeholder.svg"}
                                  alt={reply.user.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              </Link>
                              <div className="bg-dark-4 rounded-lg px-3 py-1 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link 
                                    href={`/profile/${reply.user.id}`}
                                    className="text-xs font-medium text-light-1 hover:text-primary-500"
                                  >
                                    {reply.user.name}
                                  </Link>
                                  <span className="text-xs text-light-4">
                                    @{reply.user.username}
                                  </span>
                                  {reply.is_edited && (
                                    <span className="text-xs text-light-4">• edited</span>
                                  )}
                                </div>
                                {/* Reply Content - Edit Mode */}
                                {editingComment === reply.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      type="text"
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-xs bg-dark-3 border-dark-3 text-light-1 placeholder:text-light-4 focus:border-primary-500"
                                      maxLength={2200}
                                      disabled={isUpdatingComment}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleUpdateComment(reply.id);
                                        }
                                        if (e.key === 'Escape') {
                                          cancelEdit();
                                        }
                                      }}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm" 
                                        onClick={() => handleUpdateComment(reply.id)}
                                        disabled={isUpdatingComment || !editContent.trim()}
                                        className="text-xs px-2 py-1 h-6 bg-primary-500 text-white hover:bg-primary-600 disabled:bg-dark-3"
                                      >
                                        {isUpdatingComment ? "Saving..." : "Save"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEdit}
                                        className="text-xs px-2 py-1 h-6 text-light-4 hover:text-light-2"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-light-2 whitespace-pre-wrap break-words">
                                    {reply.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Reply Meta */}
                            <div className="flex items-center gap-4 ml-6">
                              <span className="text-xs text-light-4">
                                {multiFormatDateString(reply.created_at)}
                              </span>

                              {reply._count?.likes && reply._count.likes > 0 && (
                                <span className="text-xs text-light-4">
                                  {reply._count.likes} {reply._count.likes === 1 ? 'like' : 'likes'}
                                </span>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikeComment(reply.id)}
                                className={`text-xs px-1 py-0 h-auto ${
                                  likedComments.has(reply.id) 
                                    ? 'text-red-500 hover:text-red-400' 
                                    : 'text-light-4 hover:text-primary-500'
                                }`}
                              >
                                {likedComments.has(reply.id) ? 'Unlike' : 'Like'}
                              </Button>

                              {/* Edit and Delete buttons for replies - only show if reply belongs to current user */}
                              {user && reply.user.id === user.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditComment(reply.id, reply.content)}
                                    className="text-xs text-light-4 hover:text-blue-500 px-1 py-0 h-auto"
                                  >
                                    Edit
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs text-light-4 hover:text-red-500 px-1 py-0 h-auto"
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {commentItem.replies.length > 2 && (
                          <button className="text-xs text-primary-500 hover:text-primary-400 ml-6">
                            View {commentItem.replies.length - 2} more replies
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Show More/Less Button */}
            {hasMoreComments && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-primary-500 hover:text-primary-400 text-xs"
                >
                  {showAllComments 
                    ? "Show less comments" 
                    : `View ${comments.length - 5} more comments`
                  }
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        action={authAction}
      />
    </div>
  );
};

export default QuickComment;
