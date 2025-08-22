"use client";

import { useState } from "react";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { createComment } from "@/lib/supabase/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type QuickCommentProps = {
  postId: string;
  onCommentAdded?: () => void;
};

const QuickComment = ({ postId, onCommentAdded }: QuickCommentProps) => {
  const { user } = useUserContext();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const newComment = await createComment({
        content: comment.trim(),
        postId,
        userId: user.id,
      });

      if (newComment) {
        setComment("");
        onCommentAdded?.();
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-2">
        <p className="text-light-4 text-sm">Sign in to comment</p>
      </div>
    );
  }

  return (
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
  );
};

export default QuickComment;
