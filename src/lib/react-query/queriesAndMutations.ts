import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { useUserContext } from "@/context/SupabaseAuthContext";

import {
  createPost,
  getCurrentUser,
  getPostById,
  getRecentPosts,
  getUserById,
  getUserPosts,
  likePost,
  deleteLike,
  savePost,
  deleteSave,
  getSavedPosts,
  getLikedPosts,
  signInUser,
  signOutUser,
  signUpUser,
  updatePost,
  updateUser,
  deletePost,
  getUsers,
  searchPosts,
  getInfinitePosts,
  followUser,
  unfollowUser,
  getFollowersCount,
  getFollowingCount,
  isFollowing,
  getFollowers,
  getFollowing,
} from "../supabase/api";
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types";
import { QUERY_KEYS } from "./queryKeys";
import { notificationService } from "../utils/notificationService";
export const useCreateUserAccount = () => {
    return useMutation({
        mutationFn: (user: INewUser) => signUpUser(user)
    })
}
export const useSignInAccount = () => {
    return useMutation({
        mutationFn: (user: {
            email: string; 
            password: string;
        }) => signInUser(user)
    })
}
export const useSignOutAccount = () => {
    return useMutation({
      mutationFn: signOutUser,
    });
};
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: INewPost) => createPost(post),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      
      // Create notifications for followers when a new post is created
      if (data && variables.userId) {
        try {
          const user = await getCurrentUser();
          if (user) {
            await notificationService.createNewPostNotifications(
              data.id,
              variables.userId,
              user.name || user.username || 'Unknown User',
              user.image_url || '',
              variables.caption || 'New post'
            );
          }
        } catch (error) {
          console.error('Error creating new post notifications:', error);
        }
      }
    },
  });
};
export const useUpdatePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ postId, tags, ...postData }: IUpdatePost) => {
        // Convert tags string to array for API
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
        return updatePost(postId, { 
          ...postData, 
          tags: tagsArray.length > 0 ? tagsArray : undefined 
        });
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.id],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
      },
    });
};
export const useGetRecentPosts = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      queryFn: getRecentPosts,
    });
};
export const useLikePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({
        postId,
        userId,
      }: {
        postId: string;
        userId: string;
      }) => likePost(postId, userId), // Updated to match our Supabase API
      onSuccess: async (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POST_BY_ID],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        });
        
        // Create like notification
        try {
          const post = await getPostById(variables.postId);
          const user = await getCurrentUser();
          
          if (post && user && post.creator?.id !== variables.userId) {
            await notificationService.createLikeNotification(
              variables.postId,
              post.creator.id,
              variables.userId,
              user.name || user.username || 'Unknown User',
              user.image_url || ''
            );
          }
        } catch (error) {
          console.error('Error creating like notification:', error);
        }
      },
    });
};

export const useDeleteLike = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({
        postId,
        userId,
      }: {
        postId: string;
        userId: string;
      }) => deleteLike(postId, userId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POST_BY_ID],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        });
      },
    });
};
  
export const useSavePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, postId }: { userId: string; postId: string }) =>
        savePost(postId, userId), // Note: swapped order to match our API
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_SAVED_POSTS, variables.userId],
        });
      },
    });
}; 

export const useDeleteSavedPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ postId, userId }: { postId: string; userId: string }) => 
        deleteSave(postId, userId), // Updated to use our deleteSave function
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_SAVED_POSTS, variables.userId],
        });
      },
    });
};
export const useGetCurrentUser = (enabled = true) => {
    return useQuery({
      queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      queryFn: getCurrentUser,
      enabled: enabled,
      retry: (failureCount, error) => {
        // Don't retry if it's an auth session missing error
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('session_missing') || errorMessage.includes('Auth session missing')) {
          return false
        }
        // Only retry 2 times for other errors
        return failureCount < 2
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    });
};
export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId!),
    enabled: !!postId,
  });
};
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId }: { postId: string }) =>
      deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};
export const useGetUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
    queryFn: () => getUserPosts(userId!),
    enabled: !!userId,
  });
};
// @ts-ignore
import { InfiniteData } from "@tanstack/react-query";

export const useGetPosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    queryFn: ({ pageParam }) => getInfinitePosts({ pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.documents || lastPage.documents.length === 0) {
        return null; // No more pages to fetch
      }
      return lastPage.documents[lastPage.documents.length - 1].id;
    },
    initialPageParam: undefined,
  });
};





export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};

export const useGetUsers = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS],
    queryFn: () => getUsers(limit),
  });
};

export const useGetSavedPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_SAVED_POSTS, userId],
    queryFn: () => getSavedPosts(userId!),
    enabled: !!userId,
  });
};

export const useGetLikedPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_LIKED_POSTS, userId],
    queryFn: () => getLikedPosts(userId!),
    enabled: !!userId,
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...userData }: IUpdateUser) => updateUser(userId, userData),
    onSuccess: (data) => {
      // Invalidate current user queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      
      // Invalidate specific user query
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, data?.id],
      });
      
      // Invalidate all users queries (for People page, etc.)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USERS],
      });
      
      // Invalidate posts queries since posts show user info
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
      });
      
      // Invalidate user posts
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_POSTS, data?.id],
      });
      
      // Force a complete refetch by clearing all queries
      queryClient.refetchQueries();
    },
  });
};

// ============================================================
// FOLLOW MUTATIONS AND QUERIES
// ============================================================

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.IS_FOLLOWING, userId] });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_FOLLOWERS_COUNT, userId] });
      
      // Snapshot the previous values
      const previousIsFollowing = queryClient.getQueryData([QUERY_KEYS.IS_FOLLOWING, userId]);
      const previousFollowerCount = queryClient.getQueryData([QUERY_KEYS.GET_FOLLOWERS_COUNT, userId]);
      
      // Optimistically update to the new values
      queryClient.setQueryData([QUERY_KEYS.IS_FOLLOWING, userId], true);
      if (typeof previousFollowerCount === 'number') {
        queryClient.setQueryData([QUERY_KEYS.GET_FOLLOWERS_COUNT, userId], previousFollowerCount + 1);
      }
      
      // Return a context object with the snapshotted values
      return { previousIsFollowing, previousFollowerCount, userId };
    },
    onError: (_, __, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousIsFollowing !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.IS_FOLLOWING, context.userId], context.previousIsFollowing);
      }
      if (context?.previousFollowerCount !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.GET_FOLLOWERS_COUNT, context.userId], context.previousFollowerCount);
      }
    },
    onSuccess: async (_, userId) => {
      // Create notification for the followed user
      if (user) {
        try {
          await notificationService.createFollowNotification(
            userId,
            user.id,
            user.name,
            user.image_url || ''
          );
        } catch (error) {
          console.error('Failed to create follow notification:', error);
        }
      }

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWERS_COUNT, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_COUNT],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.IS_FOLLOWING, userId],
      });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.IS_FOLLOWING, userId] });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.GET_FOLLOWERS_COUNT, userId] });
      
      // Snapshot the previous values
      const previousIsFollowing = queryClient.getQueryData([QUERY_KEYS.IS_FOLLOWING, userId]);
      const previousFollowerCount = queryClient.getQueryData([QUERY_KEYS.GET_FOLLOWERS_COUNT, userId]);
      
      // Optimistically update to the new values
      queryClient.setQueryData([QUERY_KEYS.IS_FOLLOWING, userId], false);
      if (typeof previousFollowerCount === 'number' && previousFollowerCount > 0) {
        queryClient.setQueryData([QUERY_KEYS.GET_FOLLOWERS_COUNT, userId], previousFollowerCount - 1);
      }
      
      // Return a context object with the snapshotted values
      return { previousIsFollowing, previousFollowerCount, userId };
    },
    onError: (_, __, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousIsFollowing !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.IS_FOLLOWING, context.userId], context.previousIsFollowing);
      }
      if (context?.previousFollowerCount !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.GET_FOLLOWERS_COUNT, context.userId], context.previousFollowerCount);
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWERS_COUNT, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_COUNT],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.IS_FOLLOWING, userId],
      });
    },
  });
};

export const useGetFollowersCount = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWERS_COUNT, userId],
    queryFn: () => getFollowersCount(userId),
    enabled: !!userId,
  });
};

export const useGetFollowingCount = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWING_COUNT, userId],
    queryFn: () => getFollowingCount(userId),
    enabled: !!userId,
  });
};

export const useIsFollowing = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.IS_FOLLOWING, userId],
    queryFn: () => isFollowing(userId),
    enabled: !!userId,
  });
};

export const useGetFollowers = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWERS, userId],
    queryFn: () => getFollowers(userId),
    enabled: !!userId,
  });
};

export const useGetFollowing = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWING, userId],
    queryFn: () => getFollowing(userId),
    enabled: !!userId,
  });
};
