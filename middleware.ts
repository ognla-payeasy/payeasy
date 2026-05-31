import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateCsrfToken, setCsrfCookie, CSRF_COOKIE_NAME } from "@/lib/auth/csrf";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // On GET requests to auth pages, set a csrf_token cookie if it doesn't exist yet
  if (req.method === "GET" && (path === "/login" || path === "/signup")) {
    if (!req.cookies.has(CSRF_COOKIE_NAME)) {
      const token = generateCsrfToken();
      setCsrfCookie(res, token);
    }
  }

  return res;
}

export const config = {
  matcher: ["/login", "/signup"],
};
