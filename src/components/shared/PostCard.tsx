"use client";

import Link from "next/link";
import { useState } from "react";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { useDeletePost } from "@/lib/react-query/queriesAndMutations";
import { Button } from "@/components/ui/button";
import PostStats from "./PostStats";
import QuickComment from "./QuickComment";

type PostCardProps = {
  post: any; // TODO: Add proper type from Supabase
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();
  const [showComments, setShowComments] = useState(false);
  const { mutate: deletePost } = useDeletePost();

  if (!post.creator) return;

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleDeletePost = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost({ postId: post.id });
    }
  };

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.creator.id}`}>
            <img
              src={
                post.creator?.image_url ||
                "/assets/icons/profile-placeholder.svg"
              }
              alt="creator"
              className="w-12 lg:h-12 rounded-full"
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.creator.name}
            </p>
            <div className="flex-center gap-2 text-light-3">
              <p className="subtle-semibold lg:small-regular ">
                {multiFormatDateString(post.created_at)}
              </p>
              •
              <p className="subtle-semibold lg:small-regular">
                {post.location}
              </p>
            </div>
          </div>
        </div>

        <div className={`flex gap-2 ${user?.id !== post.creator.id && "hidden"}`}>
          <Link href={`/update-post/${post.id}`}>
            <img
              src={"/assets/icons/edit.svg"}
              alt="edit"
              width={20}
              height={20}
            />
          </Link>
          
          <Button
            onClick={handleDeletePost}
            variant="ghost"
            className="p-0 h-auto"
          >
            <img
              src={"/assets/icons/delete.svg"}
              alt="delete"
              width={20}
              height={20}
            />
          </Button>
        </div>
      </div>

      <Link href={`/posts/${post.id}`}>
        <div className="small-medium lg:base-medium py-5">
          <p>{post.caption}</p>
          <ul className="flex gap-1 mt-2">
            {post.tags.map((tag: string, index: string) => (
              <li key={`${tag}${index}`} className="text-light-3 small-regular">
                #{tag}
              </li>
            ))}
          </ul>
        </div>

        <img
          src={post.image_url || "/assets/icons/profile-placeholder.svg"}
          alt="post image"
          className="post-card_img"
        />
      </Link>

      <PostStats 
        post={post} 
        userId={user?.id || ""} 
        onCommentClick={handleCommentClick}
      />

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-dark-4 pt-2">
          <QuickComment 
            postId={post.id} 
            onCommentAdded={() => {
              // Optionally refresh post data or show success message
              console.log('Comment added successfully!');
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default PostCard;
