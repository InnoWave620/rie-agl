import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "agl-rie-dev-secret-key-min-32-chars-here"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /employer routes
  if (pathname.startsWith("/employer")) {
    const token = request.cookies.get("agl-auth-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("agl-auth-token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/employer/:path*"],
};
