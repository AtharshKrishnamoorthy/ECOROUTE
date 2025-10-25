import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This is a simple middleware that allows all requests
  // The actual auth check is done client-side via AuthProvider
  // to maintain session state across page navigation
  
  const response = NextResponse.next();
  
  // Add headers to prevent caching of authenticated pages
  if (request.nextUrl.pathname.startsWith('/dashboard/main')) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
