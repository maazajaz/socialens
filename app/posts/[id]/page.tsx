"use client";
import SharedPostTopbar from "../../../src/components/shared/SharedPostTopbar";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useGetPostById } from "../../../src/lib/react-query/queriesAndMutations";
import { multiFormatDateString } from "../../../src/lib/utils";
import { useUserContext } from "../../../src/context/SupabaseAuthContext";
import { Button } from "../../../src/components/ui";
import Loader from "../../../src/components/shared/Loader";
import PostStats from "../../../src/components/shared/PostStats";
import Comments from "../../../src/components/shared/Comments";
import Link from "next/link";

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

const PostDetailPage = ({ params }: PostDetailPageProps) => {
  // ...existing code...
  const router = useRouter();
  const { id } = use(params);
  const { user } = useUserContext();

  const { data: post, isLoading } = useGetPostById(id);

  const handleDeletePost = () => {
    if (id) {
      // Add delete post functionality here
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="post_details-container">
        <div className="flex-center w-full h-full">
          <Loader />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post_details-container">
        <div className="flex-center w-full h-full">
          <p className="text-light-4">Post not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SharedPostTopbar />
      <div className="post_details-container">
      <div className="hidden md:flex max-w-5xl w-full">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="shad-button_ghost">
          <img
            src={"/assets/icons/back.svg"}
            alt="back"
            width={24}
            height={24}
          />
          <p className="small-medium lg:base-medium">Back</p>
        </Button>
      </div>

      <div className="post_details-card">
        <img
          src={post.image_url || "/assets/icons/profile-placeholder.svg"}
          alt="creator"
          className="post_details-img"
        />

        <div className="post_details-info">
          <div className="flex-between w-full">
            <Link
              href={`/profile/${post.creator.id}`}
              className="flex items-center gap-3">
              <img
                src={
                  post.creator?.image_url ||
                  "/assets/icons/profile-placeholder.svg"
                }
                alt="creator"
                className="w-8 h-8 lg:w-12 lg:h-12 rounded-full"
              />
              <div className="flex gap-1 flex-col">
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
            </Link>

            <div className="flex-center gap-4">
              <Link
                href={`/update-post/${post.id}`}
                className={`${user?.id !== post.creator.id && "hidden"}`}>
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={24}
                  height={24}
                />
              </Link>

              <Button
                onClick={handleDeletePost}
                variant="ghost"
                className={`ghost_details-delete_btn ${
                  user?.id !== post.creator.id && "hidden"
                }`}>
                <img
                  src={"/assets/icons/delete.svg"}
                  alt="delete"
                  width={24}
                  height={24}
                />
              </Button>
            </div>
          </div>

          <hr className="border w-full border-dark-4/80" />

          <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
            <p>{post.caption}</p>
            <ul className="flex gap-1 mt-2">
              {post.tags?.map((tag: string, index: number) => (
                <li
                  key={`${tag}${index}`}
                  className="text-light-3 small-regular">
                  #{tag}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full">
            <PostStats post={post} userId={user?.id || ""} />
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="w-full max-w-5xl">
        <hr className="border w-full border-dark-4/80 my-6" />
        <Comments postId={id} />
      </div>
      </div>
    </>
  );
};

export default PostDetailPage;
