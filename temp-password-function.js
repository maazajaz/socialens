export async function updateUserPassword(newPassword: string) {
  try {
    console.log('🔄 Starting simple password update...');
    console.log('🔄 Password length:', newPassword.length);
    
    // Use the simplest possible approach - just call updateUser directly
    // The PKCE flow should have already established the session
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    console.log('🔐 Direct update result:', { 
      hasData: !!data, 
      hasUser: !!data?.user,
      error: error?.message 
    });

    if (error) {
      console.log('❌ Password update failed:', error.message);
      
      // Handle specific error types
      if (error.message.includes('session')) {
        throw new Error('Your session has expired. Please use a fresh password reset link.');
      }
      
      if (error.message.includes('weak_password')) {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      
      throw error;
    }
    
    if (!data?.user) {
      throw new Error('Password update failed - no user data returned');
    }
    
    console.log('✅ Password updated successfully for:', data.user.email);
    return { success: true, message: 'Password updated successfully!' }
    
  } catch (error: any) {
    console.error('🚨 Error in updateUserPassword:', error.message);
    throw error;
  }
}
