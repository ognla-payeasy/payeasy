import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generates a cryptographically secure, random CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Validates the CSRF token from the incoming request.
 * Returns true if the token in the x-csrf-token header matches the token in the csrf_token cookie.
 */
export function validateCsrf(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken =
    req.headers.get(CSRF_HEADER_NAME) || req.headers.get("X-CSRF-Token");

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

/**
 * Sets the csrf_token cookie in the response.
 */
export function setCsrfCookie(res: NextResponse, token: string) {
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "strict" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}
