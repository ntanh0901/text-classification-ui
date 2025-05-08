import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isRootPage = request.nextUrl.pathname === "/";

  // If user is not authenticated and trying to access protected routes
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // If user is authenticated and trying to access auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ["/", "/auth/:path*"],
};
