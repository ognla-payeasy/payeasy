import { NextResponse } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/lib/auth/csrf";

/**
 * Issues a CSRF token for the double-submit cookie pattern: sets the
 * `csrf_token` cookie (readable by JS, SameSite=strict) and returns the same
 * value in the body. The client echoes it back in the `x-csrf-token` header on
 * mutating requests, and the server checks that header matches the cookie.
 */
export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  setCsrfCookie(res, token);
  return res;
}
