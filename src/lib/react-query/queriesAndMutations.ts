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
  getFollowingFeed,
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
  getPublicUserById,
  getPublicUserPosts,
  getPublicFollowersCount,
  getPublicFollowingCount,
  getPublicPostById,
  getInfinitePosts,
  followUser,
  unfollowUser,
  getFollowersCount,
  getFollowingCount,
  isFollowing,
  getFollowers,
  getFollowing,
  getAdminStats,
  checkAdminAccess,
  getAdminUsers,
  addAdminUser,
  removeAdminUser,
  sendPasswordResetEmail,
  updateUserPassword,
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
  searchUsers,
  // Admin management functions
  getAdminAllUsers,
  getAdminUserDetails,
  deactivateUser,
  toggleUserActivation,
  getAdminAllPosts,
  adminDeletePost,
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
      // Invalidate following feed so new posts appear in followers' feeds
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
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
            
            // Invalidate notifications for all followers of the post creator
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_NOTIFICATIONS],
            });
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
        // Invalidate following feed so updated posts reflect in followers' feeds
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
        });
      },
    });
};
export const useGetRecentPosts = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      queryFn: getRecentPosts,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error: any) => {
        console.log('Recent posts query failed:', error);
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });
};

export const useGetFollowingFeed = (page: number = 1, limit: number = 20) => {
    return useQuery({
      queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED, page],
      queryFn: () => getFollowingFeed(page, limit),
      staleTime: 1000 * 60 * 1, // 1 minute (shorter than recent posts for more freshness)
      retry: (failureCount, error: any) => {
        console.log('Following feed query failed:', error);
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      // Refetch when returning from background
      refetchInterval: false, // Don't auto-refetch on interval
      // Ensure fresh data when component mounts
      gcTime: 1000 * 60 * 5, // 5 minutes cache time
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
            
            // Invalidate notifications for the post owner
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_NOTIFICATIONS, post.creator.id],
            });
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
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: (failureCount, error: any) => {
      console.log('Get post by ID failed:', error);
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
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
      // Invalidate following feed so deleted posts are removed from followers' feeds
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
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
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error: any) => {
      console.log('Infinite posts query failed:', error);
      // Don't retry on auth errors
      if (error?.status === 401 || error?.message?.includes('session_missing')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};





export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
    staleTime: 1000 * 60 * 1, // 1 minute for search results
    retry: (failureCount, error: any) => {
      console.log('Search posts query failed:', error);
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Don't refetch searches on focus
  });
};

export const useGetUsers = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS],
    queryFn: () => getUsers(limit),
  });
};

export const useSearchUsers = (searchTerm: string, limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_USERS, searchTerm],
    queryFn: () => searchUsers(searchTerm, limit),
    enabled: !!searchTerm.trim(), // Only run query if search term exists
  });
};

export const useGetAdminStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_ADMIN_STATS],
    queryFn: getAdminStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCheckAdminAccess = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_ADMIN_ACCESS],
    queryFn: checkAdminAccess,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGetAdminUsers = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_ADMIN_USERS],
    queryFn: getAdminUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => addAdminUser(email),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USERS],
      });
    },
  });
};

export const useRemoveAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USERS],
      });
    },
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

// Public hooks for unauthenticated access
export const useGetPublicUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, 'public', userId],
    queryFn: () => getPublicUserById(userId),
    enabled: !!userId,
    retry: 1, // Reduce retries for faster failure
  });
};

export const useGetPublicUserPosts = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, 'public', userId],
    queryFn: () => getPublicUserPosts(userId),
    enabled: !!userId,
    retry: 1,
  });
};

export const useGetPublicFollowersCount = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWERS_COUNT, 'public', userId],
    queryFn: () => getPublicFollowersCount(userId),
    enabled: !!userId,
    retry: 1,
  });
};

export const useGetPublicFollowingCount = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWING_COUNT, 'public', userId],
    queryFn: () => getPublicFollowingCount(userId),
    enabled: !!userId,
    retry: 1,
  });
};

export const useGetPublicPostById = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, 'public', postId],
    queryFn: () => getPublicPostById(postId),
    enabled: !!postId,
    retry: 1,
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
      // Invalidate following feed to show new posts from followed user
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
      });
      // Invalidate notifications for the followed user to show new follow notification
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATIONS, userId],
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
      // Invalidate following feed to remove posts from unfollowed user
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
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

// ============ PASSWORD RESET MUTATIONS ============

export const useSendPasswordResetEmail = () => {
  return useMutation({
    mutationFn: (email: string) => sendPasswordResetEmail(email),
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (newPassword: string) => updateUserPassword(newPassword),
  });
};

// ============================================================
// NOTIFICATION QUERIES AND MUTATIONS
// ============================================================

export const useGetNotifications = (userId: string, limit: number = 20) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_NOTIFICATIONS, userId, limit],
    queryFn: () => notificationService.getUserNotifications(userId, limit),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds (notifications should be fresh)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications queries to update read status
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_UNREAD_COUNT],
      });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => notificationService.markAllNotificationsAsRead(userId),
    onSuccess: (_, userId) => {
      // Invalidate notifications queries to update read status
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTIFICATIONS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_UNREAD_COUNT, userId],
      });
    },
  });
};

// ============================================================
// COMMENT QUERIES AND MUTATIONS
// ============================================================

export const useGetComments = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMENTS, postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Comments don't change as frequently
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (comment: { content: string; postId: string; userId: string; parentId?: string }) => 
      createComment(comment),
    onSuccess: async (data, variables) => {
      // Invalidate comments for the post
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS, variables.postId],
      });
      
      // Invalidate post queries to update comment counts
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, variables.postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
      });
      
      // Create comment notification for post owner
      if (data && variables.userId) {
        try {
          const post = await getPostById(variables.postId);
          const user = await getCurrentUser();
          
          if (post && user && post.creator?.id !== variables.userId) {
            await notificationService.createCommentNotification(
              variables.postId,
              post.creator.id,
              variables.userId,
              user.name || user.username || 'Unknown User',
              user.image_url || '',
              variables.content
            );
            
            // Invalidate notifications for the post owner
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_NOTIFICATIONS, post.creator.id],
            });
          }
        } catch (error) {
          console.error('Error creating comment notification:', error);
        }
      }
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      updateComment(commentId, content),
    onSuccess: () => {
      // Find which post this comment belongs to and invalidate its comments
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS],
      });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      // Invalidate all comment queries since we don't know which post this belonged to
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS],
      });
      // Also invalidate post queries to update comment counts
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
      });
    },
  });
};

// ============================================================
// ADMIN MANAGEMENT HOOKS
// ============================================================

export const useGetAdminAllUsers = (page: number = 1, limit: number = 10, search: string = '', options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_ADMIN_ALL_USERS, page, limit, search],
    queryFn: () => getAdminAllUsers(page, limit, search),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled !== false,
  });
};

export const useGetAdminUserDetails = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_ADMIN_USER_DETAILS, userId],
    queryFn: () => getAdminUserDetails(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useToggleUserActivation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => toggleUserActivation(userId),
    onSuccess: () => {
      // Invalidate admin user queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_ALL_USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_STATS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_USER_DETAILS],
      });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      // Invalidate admin user queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_ALL_USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_STATS],
      });
    },
  });
};

export const useGetAdminAllPosts = (page: number = 1, limit: number = 10, search: string = '', options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_ADMIN_ALL_POSTS, page, limit, search],
    queryFn: () => getAdminAllPosts(page, limit, search),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled !== false,
  });
};

export const useAdminDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) => adminDeletePost(postId),
    onSuccess: () => {
      // Invalidate admin post queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_ALL_POSTS],
      });
      // Also invalidate regular post queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING_FEED],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ADMIN_STATS],
      });
    },
  });
};
