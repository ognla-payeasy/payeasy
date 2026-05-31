import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/users";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ success: false, error: "Missing verification token." }, { status: 400 });
  }

  const user = verifyEmailToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: "Invalid or expired verification token." }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Email verified successfully." });
}
