import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '../../../../../src/lib/supabase/api';
import { createClient } from '../../../../../src/lib/supabase/server';

// GET /api/admin/users/[id] - Get user details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Check admin access
    const hasAdminAccess = await checkAdminAccess();
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
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
        created_at,
        updated_at
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user statistics
    const [postsResult, followersResult, followingResult] = await Promise.allSettled([
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('creator_id', resolvedParams.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', resolvedParams.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', resolvedParams.id)
    ]);

    const stats = {
      postsCount: postsResult.status === 'fulfilled' ? postsResult.value.count || 0 : 0,
      followersCount: followersResult.status === 'fulfilled' ? followersResult.value.count || 0 : 0,
      followingCount: followingResult.status === 'fulfilled' ? followingResult.value.count || 0 : 0
    };

    return NextResponse.json({
      user,
      stats
    });

  } catch (error) {
    console.error('Admin user details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Deactivate user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Check admin access
    const hasAdminAccess = await checkAdminAccess();
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    
    // Get current admin user to prevent self-deactivation
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === resolvedParams.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Check if user exists and is not already deactivated
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if trying to deactivate another admin
    if (targetUser.is_admin) {
      return NextResponse.json(
        { error: 'Cannot deactivate another admin user' },
        { status: 400 }
      );
    }

    // Instead of actually deleting, we'll mark the user as deactivated
    // You might want to add a 'is_active' column to your users table
    // For now, we'll use a soft delete approach by updating the email to mark as deactivated
    
    const deactivatedEmail = `deactivated_${Date.now()}_${targetUser.email}`;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email: deactivatedEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id);

    if (updateError) {
      console.error('Error deactivating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User deactivated successfully',
      userId: resolvedParams.id
    });

  } catch (error) {
    console.error('Admin user deactivation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
