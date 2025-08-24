import { NextResponse } from 'next/server';
import { getAdminStats } from '../../../../src/lib/supabase/api';

// GET /api/admin/stats - Get basic statistics
export async function GET() {
  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats API error:', error);
    
    // Check if it's an access error
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
