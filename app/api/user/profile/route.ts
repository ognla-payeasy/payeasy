import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken } from "@/lib/auth/jwt";
import { findUserById, findUserByEmail, updateUserProfile, toPublicUser } from "@/lib/auth/users";
import { sanitizeEmail, sanitizeName } from "@/lib/auth/sanitize";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

export async function PATCH(req: NextRequest) {
  // Extract and verify auth token
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name: rawName, email: rawEmail } = body as Record<string, unknown>;
  const name = sanitizeName(rawName);
  const email = sanitizeEmail(rawEmail);

  // Field validation
  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Retrieve user to make sure they exist
  const user = findUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify email uniqueness if it's changing
  const existingUser = findUserByEmail(email);
  if (existingUser && existingUser.id !== payload.userId) {
    return NextResponse.json(
      { error: "Email is already in use" },
      { status: 409 }
    );
  }

  try {
    // Persist profile updates
    const updatedUser = updateUserProfile(payload.userId, name, email);

    // Sign and issue a fresh JWT cookie to sync local cookies
    const newToken = await signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    });

    const res = NextResponse.json({ user: toPublicUser(updatedUser) });
    res.cookies.set("auth_token", newToken, COOKIE_OPTS);

    return res;
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
