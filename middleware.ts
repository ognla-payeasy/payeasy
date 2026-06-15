import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "es"],
  defaultLocale: "en",
  localeDetection: true,
  localePrefix: "as-needed",
});

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge Runtime declaration - runs middleware on Vercel Edge Network for lower latency
export const runtime = "edge";

// Public API routes that don't require authentication
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/verify-email",
  "/api/health",
];

/**
 * Gets the JWT secret as a Uint8Array (Web Crypto API compatible for Edge Runtime)
 */
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

/**
 * Verifies if a request is to a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Extracts JWT token from Authorization header
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Middleware to add request tracing and JWT verification for protected routes.
 * Uses Edge-compatible APIs (Web Crypto for JWT verification, no Node.js-only APIs).
 */
export async function middleware(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ?? crypto.randomUUID();

  const pathname = new URL(request.url).pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Skip JWT verification for public routes
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Verify JWT token for protected routes using jose (Web Crypto API compatible)
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401, headers: { "x-request-id": requestId } }
    );
  }

  try {
    await jwtVerify(token, getSecret());
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401, headers: { "x-request-id": requestId } }
    );
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

