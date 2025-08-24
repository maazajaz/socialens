import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '../../../../../src/lib/supabase/api';
import { createClient } from '../../../../../src/lib/supabase/server';

// DELETE /api/admin/posts/[id] - Delete any post
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
    
    // Check if post exists
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, creator_id, image_url')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Delete related data first (comments, likes, saves)
    const deletePromises = [
      supabase.from('comments').delete().eq('post_id', resolvedParams.id),
      supabase.from('likes').delete().eq('post_id', resolvedParams.id),
      supabase.from('saves').delete().eq('post_id', resolvedParams.id)
    ];

    try {
      await Promise.all(deletePromises);
    } catch (relatedDeleteError) {
      console.warn('Some related data could not be deleted:', relatedDeleteError);
      // Continue with post deletion even if some related data fails
    }

    // Delete the post image from storage if it exists
    if (post.image_url) {
      try {
        // Extract filename from URL
        const fileName = post.image_url.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('files')
            .remove([fileName]);
          
          if (storageError) {
            console.warn('Could not delete image from storage:', storageError);
          }
        }
      } catch (storageDeleteError) {
        console.warn('Error deleting image from storage:', storageDeleteError);
      }
    }

    // Finally delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', resolvedParams.id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Post deleted successfully',
      postId: resolvedParams.id
    });

  } catch (error) {
    console.error('Admin post deletion API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
