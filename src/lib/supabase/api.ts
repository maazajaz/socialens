'use client'

import { createClient } from './client'
import { Database } from './database.types'
import { NotificationService } from '../utils/notificationService'

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

// Function to check if email or username already exists
export async function checkEmailOrUsernameExists(email: string, username: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();
    
    console.log('Checking if email/username exists:', { email: normalizedEmail, username: normalizedUsername });

    // Check email in users table
    const { data: emailCheck, error: emailError } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .limit(1);

    if (emailError) {
      console.error('Error checking email:', emailError);
      throw emailError;
    }

    // Check username in users table
    const { data: usernameCheck, error: usernameError } = await supabase
      .from('users')
      .select('username')
      .eq('username', normalizedUsername)
      .limit(1);

    if (usernameError) {
      console.error('Error checking username:', usernameError);
      throw usernameError;
    }

    const emailExists = emailCheck && emailCheck.length > 0;
    const usernameExists = usernameCheck && usernameCheck.length > 0;

    console.log('Check results:', { emailExists, usernameExists });

    return {
      emailExists,
      usernameExists,
      isAvailable: !emailExists && !usernameExists
    };
  } catch (error) {
    console.error('Error in checkEmailOrUsernameExists:', error);
    throw error;
  }
}

export async function signUpUser(user: { name: string; email: string; password: string; username: string }) {
  try {
    // Normalize email to lowercase
    const normalizedEmail = user.email.toLowerCase().trim();
    const normalizedUsername = user.username.toLowerCase().trim();
    
    console.log('Attempting to sign up user:', { 
      email: normalizedEmail, 
      name: user.name, 
      username: normalizedUsername 
    });

    // Check if email or username already exists
    const existenceCheck = await checkEmailOrUsernameExists(normalizedEmail, normalizedUsername);
    
    if (!existenceCheck.isAvailable) {
      let errorMessage = '';
      
      if (existenceCheck.emailExists && existenceCheck.usernameExists) {
        errorMessage = 'Both email and username are already registered. Please use different credentials.';
      } else if (existenceCheck.emailExists) {
        errorMessage = 'This email has already been registered. Please use a different email address.';
      } else if (existenceCheck.usernameExists) {
        errorMessage = 'This username has already been taken. Please choose a different username.';
      }
      
      const availabilityError = new Error(errorMessage);
      availabilityError.name = 'EmailOrUsernameExistsError';
      throw availabilityError;
    }

    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: user.password,
      options: {
        data: {
          name: user.name,
          username: normalizedUsername,
        }
      }
    })

    if (error) {
      console.error('Supabase auth.signUp error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code || 'No code'
      });
      throw error;
    }

    console.log('Auth signup successful:', data);
    
    // Ensure user profile is created
    if (data.user) {
      console.log('Ensuring user profile exists...');
      
      // Wait a moment for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const profile = await ensureUserProfile(data.user);
      if (!profile) {
        console.warn('Profile creation failed, but auth signup was successful');
      } else {
        console.log('Profile ensured successfully:', profile.username);
      }
    }

    return data
  } catch (error: any) {
    console.error('Error in signUpUser function:', error);
    throw error
  }
}

export async function signInUser(user: { email: string; password: string }) {
  try {
    // Normalize email to lowercase
    const normalizedEmail = user.email.toLowerCase().trim();
    
    console.log('Attempting to sign in user:', { email: normalizedEmail });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: user.password,
    })

    if (error) {
      console.error('Supabase auth.signInWithPassword error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code || 'No code'
      });
      
      // Enhance error message for better user experience
      if (error.message.includes('Email not confirmed')) {
        const enhancedError = new Error('Email verification required. Please verify your email address first, then try logging in.');
        enhancedError.name = 'EmailNotConfirmedError';
        throw enhancedError;
      }
      
      if (error.message.includes('Invalid login credentials')) {
        const enhancedError = new Error('Invalid email or password. Please check your credentials and try again.');
        enhancedError.name = 'InvalidCredentialsError';
        throw enhancedError;
      }
      
      throw error;
    }

    // Check if user is deactivated by checking the database
    if (data.user) {
      console.log('Checking if user is deactivated...');
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_deactivated, is_active')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Error checking user status:', userError);
        // Don't block login if we can't check status, but log the error
      } else if (userData) {
        if (userData.is_deactivated === true) {
          console.log('User account is deactivated:', data.user.email);
          
          // Sign them out immediately
          await supabase.auth.signOut();
          
          const deactivatedError = new Error('Your account has been deactivated. If you believe this was done in error, please contact support at support@socialens.in for assistance.');
          deactivatedError.name = 'AccountDeactivatedError';
          throw deactivatedError;
        }
        
        // Set user as active since they just logged in successfully
        console.log('Setting user as active...');
        await supabase
          .from('users')
          .update({ is_active: true })
          .eq('id', data.user.id);
      }
    }

    console.log('Sign in successful:', { user: data.user?.email });
    return data;
  } catch (error: any) {
    console.error('Error in signInUser function:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    // Get current user before signing out to update their active status
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Set user as inactive since they're logging out
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', user.id);
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Function to update user activity status (heartbeat)
export async function updateUserActivity() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('users')
        .update({ 
          is_active: true,
          last_active: new Date().toISOString()
        })
        .eq('id', user.id);
    }
  } catch (error) {
    console.error('Error updating user activity:', error);
    // Don't throw error - this is a background operation
  }
}

// Function to set user as inactive when they go offline
export async function setUserInactive(userId?: string) {
  try {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }
    
    if (targetUserId) {
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', targetUserId);
    }
  } catch (error) {
    console.error('Error setting user inactive:', error);
  }
}

// Helper function to ensure user profile exists
async function ensureUserProfile(authUser: any): Promise<any> {
  try {
    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (existingProfile && !fetchError) {
      return existingProfile;
    }
    
    // If profile doesn't exist, create it
    if (fetchError && (fetchError.code === 'PGRST116' || fetchError.message?.includes('0 rows'))) {
      console.log('Creating missing user profile for:', authUser.id);
      
      const userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
      const username = authUser.user_metadata?.username || `user_${authUser.id.substring(0, 8)}`;
      
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
            name: userName,
            username: username,
            image_url: null,
            bio: null,
            is_active: false,
            is_deactivated: false,
            last_active: null,
            privacy_setting: 'public'
          }
        ])
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating user profile:', createError);
        return null;
      }
      
      console.log('User profile created successfully:', newProfile);
      return newProfile;
    }
    
    console.error('Unexpected error fetching profile:', fetchError);
    return null;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return null;
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

    // Ensure user profile exists and return it
    const profile = await ensureUserProfile(user);
    return profile;
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

// Public version for unauthenticated access (shared profiles) using API route
export async function getPublicUserById(userId: string) {
  console.log('ðŸ” getPublicUserById called with userId:', userId);
  
  try {
    // First try direct database access
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username, email, image_url, bio, created_at')
      .eq('id', userId)
      .single()

    console.log('ðŸ“Š Direct database query result:', { data, error });

    if (error) {
      console.error('Direct user query failed:', error)
      // If RLS blocks this, try the API route
      if (error.code === 'PGRST116' || error.code === '42501' || error.message.includes('row-level security')) {
        console.log('âš ï¸ RLS blocking direct access, trying API route...')
        
        try {
          const response = await fetch(`/api/public/profile?userId=${userId}`)
          const apiData = await response.json()
          
          if (response.ok && apiData.user) {
            console.log('âœ… Got user data from API route:', apiData.user)
            return apiData.user
          } else {
            console.log('âŒ API route failed:', apiData)
          }
        } catch (apiError) {
          console.log('ðŸ’¥ API route error:', apiError)
        }
      }
      
      // For other errors, return fallback
      return {
        id: userId,
        name: 'User Profile',
        username: 'user_profile',
        email: '',
        image_url: null,
        bio: 'Profile information is currently unavailable',
        created_at: new Date().toISOString()
      }
    }
    
    console.log('âœ… Successfully fetched user data directly:', data)
    return data
  } catch (error) {
    console.error('ðŸ’¥ Exception in getPublicUserById:', error)
    // Return basic fallback info instead of null
    return {
      id: userId,
      name: 'User Profile',
      username: 'user_profile', 
      email: '',
      image_url: null,
      bio: 'This profile is currently unavailable',
      created_at: new Date().toISOString()
    }
  }
}

// Public version for getting user posts (shared profiles) using API route fallback
export async function getPublicUserPosts(userId: string) {
  console.log('ðŸ” getPublicUserPosts called with userId:', userId);
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:users!posts_creator_id_fkey (
          id,
          name,
          username,
          image_url
        ),
        likes:likes!likes_post_id_fkey (
          user_id
        ),
        saves:saves!saves_post_id_fkey (
          user_id
        )
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    console.log('ðŸ“Š Direct posts query result:', { 
      dataLength: data?.length || 0, 
      error,
      samplePost: data?.[0] ? { 
        id: data[0].id, 
        caption: data[0].caption?.substring(0, 50) + '...',
        creator: data[0].creator 
      } : null 
    });

    if (error) {
      console.error('Direct posts query failed:', error)
      // If RLS blocks this, try the API route
      if (error.code === 'PGRST116' || error.code === '42501' || error.message.includes('row-level security')) {
        console.log('âš ï¸ RLS blocking direct posts access, trying API route...')
        
        try {
          const response = await fetch(`/api/public/profile?userId=${userId}`)
          const apiData = await response.json()
          
          if (response.ok && apiData.posts) {
            console.log('âœ… Got posts data from API route:', apiData.posts.length, 'posts')
            return apiData.posts
          } else {
            console.log('âŒ API route failed for posts:', apiData)
          }
        } catch (apiError) {
          console.log('ðŸ’¥ API route error for posts:', apiError)
        }
      }
      
      return []
    }
    
    console.log('âœ… Successfully fetched', data?.length || 0, 'posts directly')
    return data || []
  } catch (error) {
    console.error('ðŸ’¥ Exception in getPublicUserPosts:', error)
    return []
  }
}

// Public version for getting followers count
export async function getPublicFollowersCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    if (error) {
      console.error('Error getting public followers count:', error)
      return 0
    }
    return count || 0
  } catch (error) {
    console.error('Error getting public followers count:', error)
    return 0
  }
}

// Public version for getting following count
export async function getPublicFollowingCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    if (error) {
      console.error('Error getting public following count:', error)
      return 0
    }
    return count || 0
  } catch (error) {
    console.error('Error getting public following count:', error)
    return 0
  }
}

// Public version for getting post details (shared posts)
export async function getPublicPostById(postId: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:users!posts_creator_id_fkey (
          id,
          name,
          username,
          image_url
        ),
        likes:likes!likes_post_id_fkey (
          user_id
        ),
        saves:saves!saves_post_id_fkey (
          user_id
        )
      `)
      .eq('id', postId)
      .single()

    if (error) {
      console.error('Error getting public post:', error)
      // If RLS blocks this, we might need to handle it differently
      if (error.code === 'PGRST116' || error.code === '42501') {
        console.log('Post access restricted for unauthenticated user')
      }
      return null
    }
    return data
  } catch (error) {
    console.error('Error getting public post:', error)
    return null
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

    // Add privacy_setting if provided
    if (userData.privacy_setting !== undefined) {
      userUpdateData.privacy_setting = userData.privacy_setting;
    }

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

export async function searchUsers(searchTerm: string, limit: number = 50) {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return []
    }

    const trimmedSearch = searchTerm.trim()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${trimmedSearch}%,username.ilike.%${trimmedSearch}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

// ============================================================
// ADMIN STATISTICS
// ============================================================

// Initial admin emails - these will be the super admins who can add others
const INITIAL_ADMIN_EMAILS = [
  'admin@socialens.com',
  'maazajaz1234@gmail.com', // Your email here
  'test@admin.com',
];

// Check if user is an initial admin (super admin)
export async function isInitialAdmin(userEmail?: string): Promise<boolean> {
  if (!userEmail) return false;
  return INITIAL_ADMIN_EMAILS.includes(userEmail.toLowerCase());
}

// Get all admin users from database
export async function getAdminUsers(): Promise<User[]> {
  try {
    // First check if current user has admin access
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_admin', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting admin users:', error);
    throw error;
  }
}

// Check if user is admin (either initial admin or database admin)
export async function isUserAdmin(userEmail?: string): Promise<boolean> {
  if (!userEmail) {
    console.log('isUserAdmin: No email provided');
    return false;
  }
  
  console.log('isUserAdmin: Checking admin status for:', userEmail);
  console.log('isUserAdmin: Initial admin emails:', INITIAL_ADMIN_EMAILS);
  
  // Check if initial admin first
  if (INITIAL_ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    console.log('isUserAdmin: User is initial admin');
    return true;
  }

  // Check database for admin status
  try {
    console.log('isUserAdmin: Checking database for admin status');
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', userEmail.toLowerCase())
      .single();

    console.log('isUserAdmin: Database query result:', { data, error });

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking admin status:', error);
      return false;
    }

    const isAdmin = data?.is_admin === true;
    console.log('isUserAdmin: Final result:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Add a new admin user
export async function addAdminUser(email: string): Promise<boolean> {
  try {
    console.log('addAdminUser: Starting process for email:', email);
    
    // Check if current user has admin access
    const hasAccess = await checkAdminAccess();
    console.log('addAdminUser: Admin access check result:', hasAccess);
    if (!hasAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    // Check if user exists in the system
    console.log('addAdminUser: Searching for user with email:', email.toLowerCase());
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    console.log('addAdminUser: User search result:', { existingUser, userError });

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!existingUser) {
      throw new Error('User with this email does not exist in the system. They must sign up first.');
    }

    if (existingUser.is_admin) {
      throw new Error('User is already an admin.');
    }

    console.log('addAdminUser: Updating user to admin status, user ID:', existingUser.id);
    // Update user to admin status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error('addAdminUser: Update error:', updateError);
      throw updateError;
    }

    console.log('addAdminUser: Successfully added admin user');
    return true;
  } catch (error) {
    console.error('Error adding admin user:', error);
    throw error;
  }
}

// Remove admin privileges from a user
export async function removeAdminUser(userId: string): Promise<boolean> {
  try {
    console.log('removeAdminUser: Starting process for userId:', userId);
    
    // Check if current user has admin access
    const hasAccess = await checkAdminAccess();
    console.log('removeAdminUser: Admin access check result:', hasAccess);
    if (!hasAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    // Get current user to prevent self-removal
    const { data: { user } } = await supabase.auth.getUser();
    console.log('removeAdminUser: Current user ID:', user?.id);
    if (user?.id === userId) {
      throw new Error('Cannot remove admin privileges from yourself.');
    }

    // Check if user is initial admin (cannot remove initial admins)
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    console.log('removeAdminUser: Target user:', { targetUser, userError });

    if (userError) throw userError;

    if (INITIAL_ADMIN_EMAILS.includes(targetUser.email.toLowerCase())) {
      throw new Error('Cannot remove initial admin privileges.');
    }

    console.log('removeAdminUser: Updating user to remove admin status');
    // Update user to remove admin status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_admin: false })
      .eq('id', userId);

    console.log('removeAdminUser: Update result:', { updateError });

    if (updateError) throw updateError;

    console.log('removeAdminUser: Successfully removed admin user');
    return true;
  } catch (error) {
    console.error('Error removing admin user:', error);
    throw error;
  }
}

export async function checkAdminAccess(): Promise<boolean> {
  try {
    console.log('checkAdminAccess: Starting admin access check');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('checkAdminAccess: Current user:', { id: user?.id, email: user?.email });
    
    if (!user?.email) {
      console.log('checkAdminAccess: No user email found');
      return false;
    }
    
    const isAdmin = await isUserAdmin(user.email);
    console.log('checkAdminAccess: isUserAdmin result:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

export async function getAdminStats() {
  try {
    // Check admin access first
    const hasAdminAccess = await checkAdminAccess();
    if (!hasAdminAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) throw usersError

    // Get total posts count
    const { count: totalPosts, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    if (postsError) throw postsError

    // Get users active today (logged in today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const { count: activeToday, error: activeTodayError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', todayISO)

    // Don't throw error for activeToday - it's optional
    if (activeTodayError) {
      console.warn('Error getting active users today:', activeTodayError)
    }

    // Get total likes count
    const { count: totalLikes, error: likesError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })

    if (likesError) throw likesError

    // Get total comments count
    const { count: totalComments, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })

    if (commentsError) throw commentsError

    // Get recent user registrations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()

    const { count: newUsers, error: newUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgoISO)

    if (newUsersError) throw newUsersError

    return {
      totalUsers: totalUsers || 0,
      totalPosts: totalPosts || 0,
      activeToday: activeToday || 0,
      totalLikes: totalLikes || 0,
      totalComments: totalComments || 0,
      newUsersThisWeek: newUsers || 0
    }
  } catch (error) {
    console.error('Error getting admin stats:', error)
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
  category: 'general' | 'announcement' | 'question'
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
      category: post.category,
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

    // Note: Notifications are now handled by the notification service in the React query mutations
    
    return data
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

export async function getRecentPosts() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get all posts without any filtering in the query
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
    
    // Client-side privacy filtering
    const filteredData = data?.filter(post => {
      const creator = post.creator;
      
      // If user is authenticated
      if (user) {
        // Always show own posts
        if (creator.id === user.id) return true;
        
        // Only show public posts from others (followers_only and private are hidden in explore/recent)
        return creator.privacy_setting === 'public';
      } else {
        // For unauthenticated users - only show public posts
        return creator.privacy_setting === 'public';
      }
    }) || [];
    
    // Add comment counts to posts
    if (filteredData.length > 0) {
      const postsWithCommentCounts = await Promise.all(
        filteredData.map(async (post) => {
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
    
    return filteredData
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

// Get posts from followed users and own posts for the following feed
// Automatically updates when user follows/unfollows someone via React Query invalidation
// Respects user privacy settings
export async function getFollowingFeed(page: number = 1, limit: number = 20) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const offset = (page - 1) * limit

    // First, get the list of followed user IDs
    const { data: followsData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    
    const followedUserIds = followsData?.map(follow => follow.following_id) || []

    // Get all posts from followed users and own posts (without privacy filtering in query)
    let query = supabase
      .from('posts')
      .select(`
        *,
        creator:users(*),
        likes(user_id),
        saves(user_id)
      `)
      .order('created_at', { ascending: false })

    if (followedUserIds.length > 0) {
      // Get own posts and posts from followed users
      query = query.or(`creator_id.eq.${user.id},creator_id.in.(${followedUserIds.join(',')})`)
    } else {
      // User doesn't follow anyone: only get own posts
      query = query.eq('creator_id', user.id)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Client-side privacy filtering
    const filteredData = data?.filter(post => {
      const creator = post.creator;
      
      // Always show own posts
      if (creator.id === user.id) return true;
      
      // For others' posts, check privacy settings
      if (creator.privacy_setting === 'private') return false;
      
      // For followers_only, check if current user follows the creator
      if (creator.privacy_setting === 'followers_only') {
        return followedUserIds.includes(creator.id);
      }
      
      // Public posts are always visible
      return true;
    }) || [];

    // Apply pagination after filtering
    const paginatedData = filteredData.slice(offset, offset + limit);
    
    // Add comment counts to posts
    if (paginatedData.length > 0) {
      const postsWithCommentCounts = await Promise.all(
        paginatedData.map(async (post) => {
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
    
    return paginatedData
  } catch (error) {
    console.error('Error getting following feed:', error)
    throw error
  }
}

export async function updatePost(postId: string, post: {
  caption?: string
  file?: File[]
  location?: string
  tags?: string[]
  category?: string
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
    if (post.category !== undefined) updateData.category = post.category

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
    
    // First, get the post details to create notification for post owner
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('creator_id, creator:users!posts_creator_id_fkey(id, name, username, image_url)')
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('Error fetching post for notification:', postError)
      throw postError
    }

    // Get the liker's details for the notification
    const { data: liker, error: likerError } = await supabase
      .from('users')
      .select('id, name, username, image_url')
      .eq('id', userId)
      .single()

    if (likerError) {
      console.error('Error fetching liker details:', likerError)
      throw likerError
    }
    
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
      console.error('Like insertion error details:', JSON.stringify(error, null, 2))
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      throw error
    }
    
    console.log('Like created successfully:', data)

    // Create like notification (don't await to avoid blocking the response)
    const notificationService = NotificationService.getInstance()
    notificationService.createLikeNotification(
      postId,
      post.creator_id,
      userId,
      liker.name || liker.username || 'Someone',
      liker.image_url || '/assets/icons/profile-placeholder.svg'
    ).catch(err => console.error('Error creating like notification:', err))
    
    return data
  } catch (error) {
    console.error('Error liking post:', error)
    console.error('Error liking post details:', JSON.stringify(error, null, 2))
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
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
    console.log('Fetching infinite posts with pageParam:', pageParam);
    
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
      } else {
        console.warn('Could not find post with pageParam:', pageParam, paramError);
      }
    }
    
    const { data, error } = await query

    if (error) {
      console.error('Supabase error in getInfinitePosts:', error);
      throw error;
    }
    
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

    console.log('Attempting to follow user:', { follower_id: user.id, following_id: followingId })

    const { data, error } = await supabase
      .from('follows')
      .insert([
        {
          follower_id: user.id,
          following_id: followingId,
        }
      ])

    if (error) {
      console.error('Database error in followUser:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    
    console.log('Successfully followed user:', data)
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

    console.log('Attempting to unfollow user:', { follower_id: user.id, following_id: followingId })

    const { data, error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (error) {
      console.error('Database error in unfollowUser:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    
    console.log('Successfully unfollowed user:', data)
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

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

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

// ============ PASSWORD RESET FUNCTIONS ============

export async function sendPasswordResetEmail(email: string) {
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('ðŸ”„ Starting password reset for email:', normalizedEmail);
    
    // First check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single()

    console.log('ðŸ‘¤ User check result:', { userData, userError });

    if (userError || !userData) {
      console.log('âŒ User not found');
      throw new Error('No account found with this email address')
    }

    console.log('ðŸ“§ Sending reset email to:', normalizedEmail);
    // Send password reset email with link (this will use your email template)
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.log('âŒ Reset email error:', error);
      throw error;
    }
    
    console.log('âœ… Reset email sent successfully');
    return { success: true, message: 'Password reset email sent! Please check your inbox.' }
  } catch (error: any) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}


export async function updateUserPassword(newPassword: string) {
  try {
    console.log('🔄 Starting password update with production-optimized approach...');
    console.log('🔄 Password length:', newPassword.length);
    console.log('🌐 Current origin:', window.location.origin);
    console.log('🌐 Environment:', process.env.NODE_ENV);
    
    // Create a completely fresh Supabase client instance
    console.log('🆕 Creating fresh Supabase client instance...');
    const freshClient = createClient();
    
    // For production/Vercel deployment, use optimized approach
    console.log('� Using production-optimized password update...');
    
    // Try to get and transfer session with shorter timeout for production
    console.log('🔄 Attempting session transfer...');
    try {
      // Shorter timeout for production environments
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout')), 2000)
      );
      
      const sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
      const { data: { session } } = sessionResult as any;
      
      if (session) {
        console.log('✅ Got session, transferring to fresh client...');
        await freshClient.auth.setSession(session);
        console.log('✅ Session transferred successfully');
      } else {
        console.log('⚠️ No session found, proceeding without transfer');
      }
    } catch (sessionError) {
      const errorMsg = sessionError instanceof Error ? sessionError.message : 'Unknown error';
      console.log('⚠️ Session transfer failed, proceeding anyway:', errorMsg);
    }
    
    // Use the fresh client for password update with timeout protection
    console.log('📞 Calling updateUser on fresh client with timeout...');
    
    const updateResult = await Promise.race([
      freshClient.auth.updateUser({ password: newPassword }),
      new Promise((_, reject) => 
        setTimeout(() => {
          console.error('⏰ Fresh client updateUser timed out after 10 seconds');
          reject(new Error('Password update timed out. This may be a network or Supabase service issue.'));
        }, 10000)
      )
    ]);
    
    const { data, error } = updateResult as any;

    console.log('🔐 Fresh client update result:', {
      hasData: !!data,
      hasUser: !!data?.user,
      error: error?.message
    });

    if (error) {
      console.log('❌ Fresh client password update failed:', error.message);
      console.log('❌ Error details:', {
        status: error.status,
        code: error.code || 'no-code'
      });
      
      // If fresh client also fails, this might be a Supabase service issue
      if (error.message.includes('timeout') || error.message.includes('network')) {
        throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
      }
      
      // Handle specific error types
      if (error.message.includes('session') || error.message.includes('unauthorized')) {
        throw new Error('Your session has expired. Please use a fresh password reset link.');
      }
      
      if (error.message.includes('weak_password')) {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      
      if (error.message.includes('same_password')) {
        throw new Error('New password must be different from your current password.');
      }
      
      throw error;
    }
    
    if (!data?.user) {
      throw new Error('Password update failed - no user data returned');
    }
    
    console.log('✅ Password updated successfully with fresh client for:', data.user.email);
    return { success: true, message: 'Password updated successfully!' }
    
  } catch (error: any) {
    console.error('🚨 Error in updateUserPassword:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 200) + '...'
    });
    throw error;
  }
}

// ============================================================
// ADMIN MANAGEMENT FUNCTIONS
// ============================================================

// Get all users for admin management
export async function getAdminAllUsers(page: number = 1, limit: number = 10, search: string = '') {
  try {
    console.log('getAdminAllUsers called with:', { page, limit, search });
    
    const hasAdminAccess = await checkAdminAccess();
    console.log('Admin access check result:', hasAdminAccess);
    
    if (!hasAdminAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        username,
        email,
        image_url,
        bio,
        is_admin,
        is_active,
        is_deactivated,
        last_active,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    console.log('Executing query...');
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    console.log('Query successful, found:', count, 'users');
    return {
      users: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all users for admin:', error);
    throw error;
  }
}

// Get user details for admin
export async function getAdminUserDetails(userId: string) {
  try {
    const hasAdminAccess = await checkAdminAccess();
    if (!hasAdminAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        username,
        email,
        image_url,
        bio,
        is_admin,
        is_active,
        is_deactivated,
        last_active,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Get user statistics
    const [postsResult, followersResult, followingResult] = await Promise.allSettled([
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
    ]);

    const stats = {
      postsCount: postsResult.status === 'fulfilled' ? postsResult.value.count || 0 : 0,
      followersCount: followersResult.status === 'fulfilled' ? followersResult.value.count || 0 : 0,
      followingCount: followingResult.status === 'fulfilled' ? followingResult.value.count || 0 : 0
    };

    return { user, stats };
  } catch (error) {
    console.error('Error getting user details for admin:', error);
    throw error;
  }
}

// Toggle user activation status (admin only)
export async function toggleUserActivation(userId: string) {
  try {
    const hasAdminAccess = await checkAdminAccess();
    if (!hasAdminAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    // Get current admin user to prevent self-deactivation
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === userId) {
      throw new Error('Cannot modify your own account status');
    }

    // Get current user status
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, is_admin, is_deactivated, is_active')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      throw new Error('User not found');
    }

    // Check if trying to deactivate another admin
    if (targetUser.is_admin && !targetUser.is_deactivated) {
      throw new Error('Cannot deactivate another admin user');
    }

    // Toggle the activation status
    const newDeactivatedStatus = !targetUser.is_deactivated;
    const newActiveStatus = !newDeactivatedStatus; // Active is opposite of deactivated
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_deactivated: newDeactivatedStatus,
        is_active: newActiveStatus
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    const action = newDeactivatedStatus ? 'deactivated' : 'activated';
    return { 
      success: true, 
      message: `User ${action} successfully`,
      isDeactivated: newDeactivatedStatus
    };
  } catch (error) {
    console.error('Error toggling user activation:', error);
    throw error;
  }
}

// Legacy function for backward compatibility - now uses toggleUserActivation
export async function deactivateUser(userId: string) {
  try {
    // Check current status first
    const { data: targetUser } = await supabase
      .from('users')
      .select('is_deactivated')
      .eq('id', userId)
      .single();

    if (!targetUser || targetUser.is_deactivated) {
      throw new Error('User not found or already deactivated');
    }

    return await toggleUserActivation(userId);
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
}

// Get all posts for admin management
export async function getAdminAllPosts(page: number = 1, limit: number = 10, search: string = '') {
  try {
    console.log('getAdminAllPosts called with:', { page, limit, search });
    
    const hasAdminAccess = await checkAdminAccess();
    console.log('Admin access check result for posts:', hasAdminAccess);
    
    if (!hasAdminAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('posts')
      .select(`
        id,
        caption,
        image_url,
        location,
        tags,
        created_at,
        creator:users!creator_id (
          id,
          name,
          username,
          image_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`caption.ilike.%${search}%,location.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    console.log('Executing posts query...');
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Database query error for posts:', error);
      throw error;
    }

    console.log('Posts query successful, found:', count, 'posts');
    return {
      posts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all posts for admin:', error);
    throw error;
  }
}

// Delete post (admin only)
export async function adminDeletePost(postId: string) {
  try {
    const hasAdminAccess = await checkAdminAccess();
    if (!hasAdminAccess) {
      throw new Error('Access denied. Admin privileges required.');
    }

    // Check if post exists
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, creator_id, image_url')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      throw new Error('Post not found');
    }

    // Delete related data first (comments, likes, saves)
    const deletePromises = [
      supabase.from('comments').delete().eq('post_id', postId),
      supabase.from('likes').delete().eq('post_id', postId),
      supabase.from('saves').delete().eq('post_id', postId)
    ];

    try {
      await Promise.all(deletePromises);
    } catch (relatedDeleteError) {
      console.warn('Some related data could not be deleted:', relatedDeleteError);
    }

    // Delete the post image from storage if it exists
    if (post.image_url) {
      try {
        const fileName = post.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('files').remove([fileName]);
        }
      } catch (storageDeleteError) {
        console.warn('Error deleting image from storage:', storageDeleteError);
      }
    }

    // Finally delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

    return { success: true, message: 'Post deleted successfully' };
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}


