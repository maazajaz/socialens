"use client";

import { useState } from "react";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { createComment } from "@/lib/supabase/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type CommentFormProps = {
  postId: string;
  parentId?: string;
  onCommentCreated?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

const CommentForm = ({
  postId,
  parentId,
  onCommentCreated,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = false,
}: CommentFormProps) => {
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
        parentId,
      });

      if (newComment) {
        setComment("");
        onCommentCreated?.();
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
      <Image
        src={user.image_url || "/assets/icons/profile-placeholder.svg"}
        alt="Your profile"
        width={32}
        height={32}
        className="rounded-full"
      />
      
      <div className="flex-1 flex items-center gap-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 border-none bg-transparent text-sm placeholder:text-light-4"
          maxLength={2200}
          autoFocus={autoFocus}
          disabled={isSubmitting}
        />
        
        <div className="flex items-center gap-1">
          {parentId && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-light-4 hover:text-light-2 px-2 py-1 h-auto text-xs"
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={!comment.trim() || isSubmitting}
            className="text-primary-500 hover:text-primary-600 disabled:text-light-4 px-2 py-1 h-auto text-xs font-semibold"
          >
            {isSubmitting ? "Posting..." : parentId ? "Reply" : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
