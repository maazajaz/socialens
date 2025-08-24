import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '../../../../src/lib/supabase/api';
import { createClient } from '../../../../src/lib/supabase/server';

// GET /api/admin/posts - List all posts
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
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
        updated_at,
        creator:users!creator_id (
          id,
          name,
          username,
          image_url
        )
      `)
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`caption.ilike.%${search}%,location.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Admin posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
