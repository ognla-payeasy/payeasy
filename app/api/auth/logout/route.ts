import { NextRequest, NextResponse } from "next/server";
import { validateCsrf } from "@/lib/auth/csrf";

export async function POST(req: NextRequest) {
  // Validate CSRF
  if (!validateCsrf(req)) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
