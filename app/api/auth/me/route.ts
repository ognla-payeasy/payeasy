import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { findUserById, toPublicUser } from "@/lib/auth/users";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json(null);

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json(null);

  const user = findUserById(payload.userId);
  if (!user) return NextResponse.json(null);

  return NextResponse.json(toPublicUser(user));
}
