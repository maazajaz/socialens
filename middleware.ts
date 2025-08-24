import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to static files, API routes, and images
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/assets/')
  ) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/update-password',
    '/auth/callback',
    '/posts', // Allow public access to individual posts
    '/profile', // Allow public access to profiles
    '/shared-profile', // Allow public access to shared profiles
  ]

  // Check if the current route is public or starts with a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // For now, allow all routes to be accessed publicly
  // The authentication checks will be handled at the component level
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, we'll let the components handle the auth state
  // This allows for better UX where users can see content but get prompted to auth for interactions
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
