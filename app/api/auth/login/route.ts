import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, toPublicUser } from "@/lib/auth/users";
import { signToken } from "@/lib/auth/jwt";
import { createRateLimiter, getClientIp } from "@/lib/auth/rate-limit";
import { sanitizeEmail, sanitizePassword } from "@/lib/auth/sanitize";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

// Rate limiter: 10 requests per 15 minutes per IP
const rateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export async function POST(req: NextRequest) {
  // Extract client IP for rate limiting
  const clientIp = getClientIp(req.headers);

  // Check rate limit
  const rateLimit = rateLimiter.check(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter || 900),
          "X-RateLimit-Limit": "10",
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

  const { email: rawEmail, password: rawPassword } = body as Record<string, unknown>;
  const email = sanitizeEmail(rawEmail);
  const password = sanitizePassword(rawPassword);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({ user: toPublicUser(user) });
    res.cookies.set("auth_token", token, COOKIE_OPTS);
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
