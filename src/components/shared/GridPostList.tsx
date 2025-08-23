"use client";

import Link from "next/link";
import { useUserContext } from "@/context/SupabaseAuthContext";
import PostStats from "./PostStats";

type GridPostListProps = {
  posts: any[]; // Posts array from Supabase
  showUser?: boolean;
  showStats?: boolean;
};

const GridPostList = ({
  posts,
  showUser = true,
  showStats = true,
}: GridPostListProps) => {
  const { user } = useUserContext();

  return (
    <ul className="grid-container">
      {posts.map((post) => (
        <li key={post.id || post.$id} className="relative min-w-80 h-80">
          <Link href={`/posts/${post.id || post.$id}`} className="grid-post_link">
            <img
              src={post.image_url || post.imageUrl}
              alt="post"
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="grid-post_user">
            {showUser && (
              <div className="flex items-center justify-start gap-2 flex-1">
                <img
                  src={
                    post.creator?.image_url || post.creator?.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 rounded-full"
                />
                <p className="line-clamp-1">{post.creator?.name}</p>
              </div>
            )}
            {showStats && user && <PostStats post={post} userId={user.id} />}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default GridPostList;
