"use client";

import PostFormNextJS from '../../components/forms/PostFormNextJS';
import { useGetPostById } from '../../lib/react-query/queriesAndMutations';
import ClientLayoutWrapper from '../ClientLayoutWrapper';
import Loader from '../../components/shared/Loader';

interface EditPostWrapperProps {
  postId: string;
}

const EditPostWrapper = ({ postId }: EditPostWrapperProps) => {
  const { data: post, isLoading } = useGetPostById(postId);

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-4">Post not found</p>
      </div>
    );
  }

  return (
    <ClientLayoutWrapper>
      <div className="flex flex-1">
        <div className="common-container">
          <div className="flex-start gap-3 justify-start w-full max-w-5xl">
            <img
              src="/assets/icons/edit.svg"
              width={36}
              height={36}
              alt="edit"
              className="invert-white"
            />
            <h2 className="h3-bold md:h2-bold text-left w-full">Edit Post</h2>
          </div>
          <PostFormNextJS action="Update" post={post} />
        </div>
      </div>
    </ClientLayoutWrapper>
  );
};

export default EditPostWrapper;
