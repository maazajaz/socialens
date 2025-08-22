'use client'

import { createClient } from './client'
import { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Post = Database['public']['Tables']['posts']['Row'] & {
  creator: User
  likes: Array<{ user_id: string }>
  saves: Array<{ user_id: string }>
  comments?: Comment[]
  _count?: {
    comments: number
  }
}
export type Like = Database['public']['Tables']['likes']['Row']
export type Save = Database['public']['Tables']['saves']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Comment = Database['public']['Tables']['comments']['Row'] & {
  user: User
  likes: Array<{ user_id: string }>
  replies?: Comment[]
  _count?: {
    likes: number
    replies: number
  }
}
export type CommentLike = Database['public']['Tables']['comment_likes']['Row']

const supabase = createClient()

// ============================================================
// AUTH
// ============================================================

export async function signUpUser(user: { name: string; email: string; password: string; username: string }) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          name: user.name,
          username: user.username,
        }
      }
    })

    if (error) throw error

    // Create user profile in users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: user.email,
            name: user.name,
            username: user.username,
          }
        ])
      
      if (profileError) throw profileError
    }

    return data
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

export async function signInUser(user: { email: string; password: string }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      // Only log auth errors if they're not just "missing session" errors
      if (!authError.message?.includes('session_missing') && !authError.message?.includes('Auth session missing')) {
        console.error('Auth error:', authError)
      }
      return null
    }
    
    if (!user) return null

    // Get user profile from users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return null
    }
    
    return profile
  } catch (error) {
    // Only log errors if they're not authentication-related
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes('session_missing') && !errorMessage.includes('Auth session missing')) {
      console.error('Error getting current user:', error)
    }
    return null
  }
}

// ============================================================
// USER
// ============================================================

export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

export async function updateUser(userId: string, userData: any) {
  try {
    let imageUrl = userData.imageUrl;

    // Handle file upload if there's a new file
    if (userData.file && userData.file.length > 0) {
      const file = userData.file[0];
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile-${userId}-${Date.now()}.${fileExtension}`;

      try {
        // Try to upload file to Supabase storage (using posts bucket for now)
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          // Continue without updating the image if upload fails
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        }
      } catch (error) {
        console.error('Storage upload failed, continuing without image update:', error);
      }
    }

    // Prepare user data for database update
    const userUpdateData: any = {
      name: userData.name,
      username: userData.username,
      email: userData.email,
      bio: userData.bio,
    };

    // Only include image_url if we have one
    if (imageUrl) {
      userUpdateData.image_url = imageUrl;
    }

    const { data, error } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export async function getUsers(limit?: number) {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting users:', error)
    throw error
  }
}

// ============================================================
// POSTS
// ============================================================

export async function createPost(post: {
  caption: string
  file: File[]
  location?: string
  tags?: string
  userId: string
}) {
  try {
    console.log('Creating post with data:', post)
    console.log('User ID:', post.userId)
    console.log('User ID type:', typeof post.userId)
    
    let imageUrl = null

    // Upload file if provided - with better error handling
    if (post.file && post.file.length > 0) {
      console.log('Uploading file:', post.file[0])
      const firstFile = post.file[0]
      
      // Check file size (limit to 2MB for better performance)
      if (firstFile.size > 2 * 1024 * 1024) {
        throw new Error('File size too large. Please choose a file smaller than 2MB.')
      }
      
      const fileExt = firstFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      console.log('Starting upload to storage...')
      try {
        // Simple direct upload without timeout wrapper for testing
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, firstFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('File upload error:', uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        console.log('File uploaded successfully to:', fileName)

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
        console.log('Public URL generated:', imageUrl)
      } catch (uploadErr) {
        console.error('Upload process failed:', uploadErr)
        // Continue without image if upload fails
        console.log('Continuing post creation without image due to upload failure')
        imageUrl = null
      }
    }

    console.log('Creating post record in database...')
    
    // Convert tags string to array
    let tagsArray: string[] | null = null
    if (post.tags) {
      // Split the tags string by comma and trim whitespace
      tagsArray = post.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
    }
    
    // Log the exact data being inserted
    const insertData = {
      caption: post.caption,
      image_url: imageUrl,
      location: post.location,
      tags: tagsArray,
      creator_id: post.userId,
    }
    console.log('Insert data:', insertData)
    
    // Create post record
    const { data, error } = await supabase
      .from('posts')
      .insert([insertData])
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .single()

    if (error) {
      console.error('Database insert error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log('Post created successfully:', data)
    return data
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

export async function getRecentPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Add comment counts to posts
    if (data) {
      const postsWithCommentCounts = await Promise.all(
        data.map(async (post) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          
          return {
            ...post,
            _count: {
              comments: count || 0
            }
          }
        })
      )
      return postsWithCommentCounts
    }
    
    return data
  } catch (error) {
    console.error('Error getting recent posts:', error)
    throw error
  }
}

export async function getPostById(postId: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .eq('id', postId)
      .single()

    if (error) throw error
    
    // Add comment count to post
    if (data) {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', data.id)
      
      return {
        ...data,
        _count: {
          comments: count || 0
        }
      }
    }
    
    return data
  } catch (error) {
    console.error('Error getting post:', error)
    throw error
  }
}

export async function getUserPosts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user posts:', error)
    throw error
  }
}

export async function updatePost(postId: string, post: {
  caption?: string
  file?: File[]
  location?: string
  tags?: string[]
}) {
  try {
    let imageUrl: string | undefined

    // Upload new file if provided
    if (post.file && post.file.length > 0) {
      const firstFile = post.file[0]
      const fileExt = firstFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, firstFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      imageUrl = publicUrl
    }

    // Update post record
    const updateData: any = {}
    if (post.caption !== undefined) updateData.caption = post.caption
    if (imageUrl !== undefined) updateData.image_url = imageUrl
    if (post.location !== undefined) updateData.location = post.location
    if (post.tags !== undefined) updateData.tags = post.tags

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

export async function deletePost(postId: string) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

// ============================================================
// LIKES
// ============================================================

export async function likePost(postId: string, userId: string) {
  try {
    console.log('Liking post:', { postId, userId })
    
    const { data, error } = await supabase
      .from('likes')
      .insert([
        {
          post_id: postId,
          user_id: userId,
        }
      ])
      .select()

    if (error) {
      console.error('Like insertion error:', error)
      throw error
    }
    
    console.log('Like created successfully:', data)
    return data
  } catch (error) {
    console.error('Error liking post:', error)
    throw error
  }
}

export async function deleteLike(postId: string, userId: string) {
  try {
    console.log('Unliking post:', { postId, userId })
    
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) {
      console.error('Unlike deletion error:', error)
      throw error
    }
    
    console.log('Like deleted successfully')
  } catch (error) {
    console.error('Error unliking post:', error)
    throw error
  }
}

// ============================================================
// SAVES
// ============================================================

export async function savePost(postId: string, userId: string) {
  try {
    console.log('Saving post:', { postId, userId })
    console.log('PostId type:', typeof postId, 'UserId type:', typeof userId)
    
    // Direct insert - let the database handle duplicates with a meaningful error
    const { data, error } = await supabase
      .from('saves')
      .insert([
        {
          post_id: postId,
          user_id: userId,
        }
      ])
      .select()

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') { // Unique constraint violation
        console.log('Post already saved by this user (duplicate key ignored)')
        // Query the existing save record
        const { data: existingSave } = await supabase
          .from('saves')
          .select()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single()
        return existingSave
      }
      
      console.error('Save insertion error:', error)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      console.error('Error code:', error.code)
      throw error
    }
    
    console.log('Post saved successfully:', data)
    return data
  } catch (error) {
    console.error('Error saving post:', error)
    throw error
  }
}

export async function deleteSave(postId: string, userId: string) {
  try {
    console.log('Unsaving post:', { postId, userId })
    
    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) {
      console.error('Unsave deletion error:', error)
      throw error
    }
    
    console.log('Post unsaved successfully')
  } catch (error) {
    console.error('Error unsaving post:', error)
    throw error
  }
}

export async function getSavedPosts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('saves')
      .select(`
        *,
        posts:posts!inner(
          *,
          creator:users(*),
          likes(user_id),
          saves(user_id)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map(save => save.posts) || []
  } catch (error) {
    console.error('Error getting saved posts:', error)
    throw error
  }
}

// Check if a post is saved by a specific user
export async function isPostSaved(postId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('saves')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error
    }

    return !!data // Returns true if found, false if not
  } catch (error) {
    console.error('Error checking if post is saved:', error)
    return false
  }
}

// ============================================================
// FILE UPLOAD
// ============================================================

export async function uploadFile(file: File, bucket: string) {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export async function deleteFile(url: string, bucket: string) {
  try {
    // Extract filename from URL
    const fileName = url.split('/').pop()
    if (!fileName) throw new Error('Invalid file URL')

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (error) throw error
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

// ============================================================
// SEARCH
// ============================================================

export async function searchPosts(searchTerm: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .or(`caption.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error searching posts:', error)
    throw error
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam?: string }) {
  try {
    const pageSize = 10 // Number of posts per page
    
    let query = supabase
      .from('posts')
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(pageSize)
    
    // If pageParam is provided, fetch posts created before that timestamp
    if (pageParam) {
      // Get the post with pageParam id to get its created_at timestamp
      const { data: paramPost, error: paramError } = await supabase
        .from('posts')
        .select('created_at')
        .eq('id', pageParam)
        .single()
      
      if (!paramError && paramPost) {
        query = query.lt('created_at', paramPost.created_at)
      }
    }
    
    const { data, error } = await query

    if (error) throw error
    
    // Return in the format expected by react-query infinite queries
    return {
      documents: data || [],
      hasMore: data && data.length === pageSize
    }
  } catch (error) {
    console.error('Error getting infinite posts:', error)
    throw error
  }
}

// ============================================================
// LIKES
// ============================================================

export async function getLikedPosts(userId: string) {
  try {
    if (!userId) throw new Error('User ID is required')

    const { data, error } = await supabase
      .from('likes')
      .select(`
        post:posts (
          *,
          creator:users (
            id,
            name,
            username,
            image_url
          ),
          likes (user_id),
          saves (user_id)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to match our Post type structure
    const likedPosts = data?.map((item: any) => ({
      ...item.post,
      likes: item.post?.likes || [],
      saves: item.post?.saves || []
    })).filter((post: any) => post?.id) || []

    return likedPosts
  } catch (error) {
    console.error('Error getting liked posts:', error)
    throw error
  }
}

// ============================================================
// FOLLOW FUNCTIONALITY
// ============================================================

export async function followUser(followingId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('follows')
      .insert([
        {
          follower_id: user.id,
          following_id: followingId,
        }
      ])

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error following user:', error)
    throw error
  }
}

export async function unfollowUser(followingId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error unfollowing user:', error)
    throw error
  }
}

export async function getFollowersCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting followers count:', error)
    return 0
  }
}

export async function getFollowingCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting following count:', error)
    return 0
  }
}

export async function isFollowing(followingId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  } catch (error) {
    console.error('Error checking if following:', error)
    return false
  }
}

export async function getFollowers(userId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:users!follows_follower_id_fkey (
          id,
          name,
          username,
          image_url
        )
      `)
      .eq('following_id', userId)

    if (error) throw error
    return data?.map(item => item.follower).filter(Boolean) || []
  } catch (error) {
    console.error('Error getting followers:', error)
    return []
  }
}

export async function getFollowing(userId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:users!follows_following_id_fkey (
          id,
          name,
          username,
          image_url
        )
      `)
      .eq('follower_id', userId)

    if (error) throw error
    return data?.map(item => item.following).filter(Boolean) || []
  } catch (error) {
    console.error('Error getting following:', error)
    return []
  }
}

// ============================================================
// COMMENTS
// ============================================================

export async function createComment(comment: {
  content: string
  postId: string
  userId: string
  parentId?: string
}): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          content: comment.content,
          post_id: comment.postId,
          user_id: comment.userId,
          parent_id: comment.parentId || null,
        },
      ])
      .select(`
        *,
        user:users (
          id,
          name,
          username,
          image_url
        ),
        likes:comment_likes (
          user_id
        )
      `)
      .single()

    if (error) throw error
    return data as Comment
  } catch (error) {
    console.error('Error creating comment:', error)
    return null
  }
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users (
          id,
          name,
          username,
          image_url
        ),
        likes:comment_likes (
          user_id
        )
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    if (error) throw error

    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const replies = await getCommentReplies(comment.id)
        return {
          ...comment,
          replies,
          _count: {
            likes: comment.likes?.length || 0,
            replies: replies.length,
          },
        } as Comment
      })
    )

    return commentsWithReplies
  } catch (error) {
    console.error('Error getting post comments:', error)
    return []
  }
}

export async function getCommentReplies(commentId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users (
          id,
          name,
          username,
          image_url
        ),
        likes:comment_likes (
          user_id
        )
      `)
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data || []).map(comment => ({
      ...comment,
      _count: {
        likes: comment.likes?.length || 0,
        replies: 0,
      },
    })) as Comment[]
  } catch (error) {
    console.error('Error getting comment replies:', error)
    return []
  }
}

export async function updateComment(commentId: string, content: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ 
        content,
        is_edited: true,
      })
      .eq('id', commentId)
      .select(`
        *,
        user:users (
          id,
          name,
          username,
          image_url
        ),
        likes:comment_likes (
          user_id
        )
      `)
      .single()

    if (error) throw error
    return data as Comment
  } catch (error) {
    console.error('Error updating comment:', error)
    return null
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting comment:', error)
    return false
  }
}

export async function likeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comment_likes')
      .insert([{ comment_id: commentId, user_id: userId }])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error liking comment:', error)
    return false
  }
}

export async function unlikeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error unliking comment:', error)
    return false
  }
}

export async function getCommentLikeStatus(commentId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  } catch (error) {
    console.error('Error checking comment like status:', error)
    return false
  }
}
