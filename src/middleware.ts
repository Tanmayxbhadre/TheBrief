import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

const COOKIE_NAME = 'thebrief_admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes, exempt /admin/login and static files
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Also check /api/admin routes, except auth endpoints
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    // Allow Bearer token if matching ADMIN_SECRET (e.g. for external cron/CLI)
    const isBearerValid = adminSecret && authHeader === `Bearer ${adminSecret}`;

    if (!sessionCookie && !isBearerValid) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
