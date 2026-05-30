import { NextResponse } from "next/server";
import {
  getNotificationPreferences,
  isValidNotificationPatch,
  updateNotificationPreferences,
} from "@/lib/auth/users";

function resolveUserId(request: Request): string | null {
  const headerId = request.headers.get("x-user-id");
  if (headerId && headerId.trim().length > 0) return headerId.trim();
  return null;
}

export async function GET(request: Request) {
  const userId = resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({
    notificationPreferences: getNotificationPreferences(userId),
  });
}

export async function PATCH(request: Request) {
  const userId = resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidNotificationPatch(body)) {
    return NextResponse.json(
      { error: "Invalid notification preference payload" },
      { status: 400 },
    );
  }

  const updated = updateNotificationPreferences(userId, body as any);
  return NextResponse.json({ notificationPreferences: updated });
}
