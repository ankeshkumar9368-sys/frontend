import { NextRequest, NextResponse } from 'next/server';

const TEACHER_TOKEN_COOKIE = 'achivox_teacher_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /teacher routes — but NOT /teacher/login (the login page itself)
  if (pathname.startsWith('/teacher') && !pathname.startsWith('/teacher/login')) {
    const teacherToken = request.cookies.get(TEACHER_TOKEN_COOKIE)?.value;

    if (!teacherToken || teacherToken.trim() === '') {
      // No token → redirect to teacher login page
      const loginUrl = new URL('/teacher/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/teacher', '/teacher/:path*'],
};
