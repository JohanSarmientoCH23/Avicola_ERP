import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const userStr = request.cookies.get('user')?.value;

  if (!userStr) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/dashboard')) {
    try {
      if (userStr) {
        const user = JSON.parse(userStr);

        if (pathname.includes('/users') && user.rol !== 'ADMINISTRADOR') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        if (pathname.includes('/costs') && !['ADMINISTRADOR', 'CONTADOR'].includes(user.rol)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        if (pathname.includes('/reconciliation') && !['ADMINISTRADOR', 'CONTADOR'].includes(user.rol)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        if (pathname.includes('/audit') && !['ADMINISTRADOR', 'CONTADOR', 'AUDITOR'].includes(user.rol)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
