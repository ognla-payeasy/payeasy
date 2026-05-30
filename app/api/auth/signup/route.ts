import { test } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser, toPublicUser } from "@/lib/auth/users";
import { signToken } from "@/lib/auth/jwt";
import { createRateLimiter, getClientIp } from "@/lib/auth/rate-limit";
import { sanitizeEmail, sanitizeName, sanitizePassword } from "@/lib/auth/sanitize";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

// Rate limiter: 5 requests per hour per IP
const rateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export async function POST(req: NextRequest) {
  // Extract client IP for rate limiting
  const clientIp = getClientIp(req.headers);

  // Check rate limit
  const rateLimit = await rateLimiter.check(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many signup attempts. Please try again later.",
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter || 3600),
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(
            Date.now() + rateLimit.resetAfter
          ),
        },
      }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    email: rawEmail,
    name: rawName,
    password: rawPassword,
  } = body as Record<string, unknown>;
  const email = sanitizeEmail(rawEmail);
  const name = sanitizeName(rawName);
  const password = sanitizePassword(rawPassword);

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser(email, name, passwordHash);
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    res.cookies.set("auth_token", token, COOKIE_OPTS);
    return res;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}
