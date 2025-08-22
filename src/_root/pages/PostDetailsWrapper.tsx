"use client";

import PostDetails from './PostDetails';
import { useGetPostById } from '../../lib/react-query/queriesAndMutations';
import ClientLayoutWrapper from '../ClientLayoutWrapper';
import Loader from '../../components/shared/Loader';

interface PostDetailsWrapperProps {
  postId: string;
}

const PostDetailsWrapper = ({ postId }: PostDetailsWrapperProps) => {
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
      <PostDetails />
    </ClientLayoutWrapper>
  );
};

export default PostDetailsWrapper;
