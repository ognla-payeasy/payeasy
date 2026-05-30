import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken, isTokenExpiringWithin } from "@/lib/auth/jwt";
import { findUserById, toPublicUser } from "@/lib/auth/users";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

/**
 * POST /api/auth/refresh
 *
 * Refreshes an expiring auth token.
 * This endpoint checks if the current token is expiring within 24 hours,
 * and if so, issues a new token.
 *
 * Returns 200 with new token if successful.
 * Returns 401 if token is invalid or fully expired.
 * Returns 204 if token is still valid and not close to expiry.
 */
export async function POST(req: NextRequest) {
  try {
    // Get token from cookie
    const authToken = req.cookies.get("auth_token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    // Verify token is valid
    const payload = await verifyToken(authToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if token is expiring within 24 hours
    const isExpiring = await isTokenExpiringWithin(authToken, 86400);

    if (!isExpiring) {
      // Token is still valid, no refresh needed
      return NextResponse.json(
        { message: "Token still valid" },
        { status: 204 }
      );
    }

    // Get user to include in new token
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Issue new token
    const newToken = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      message: "Token refreshed",
      user: toPublicUser(user),
    });
    res.cookies.set("auth_token", newToken, COOKIE_OPTS);

    return res;
  } catch (err) {
    console.error("Refresh token error:", err);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    );
  }
}
