import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateCsrfToken, setCsrfCookie, CSRF_COOKIE_NAME } from "@/lib/auth/csrf";

export function middleware(req: NextRequest) {
  // Generate a cryptographically secure random base64-encoded nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Set the nonce on the request headers so it can be read in server components (if needed)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  // Set the updated CSP header value on the request
  const cspHeader = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; connect-src 'self' https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org; img-src 'self' data: https://images.unsplash.com https://i.pravatar.cc`;
  requestHeaders.set("Content-Security-Policy", cspHeader);

  // Create response passing modified request headers
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set the CSP header on the response
  res.headers.set("Content-Security-Policy", cspHeader);

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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

