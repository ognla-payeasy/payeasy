import { NextResponse } from "next/server";
import { savePushSubscription, type PushSubscriptionRecord } from "@/lib/push";

interface SubscribeBody {
  contractId?: string;
  subscription?: PushSubscriptionRecord;
}

function resolveUserId(request: Request, body: SubscribeBody): string | null {
  const headerId = request.headers.get("x-user-id")?.trim();
  if (headerId) return headerId;
  if (typeof body.contractId === "string" && body.contractId.trim()) {
    return body.contractId.trim();
  }
  return null;
}

export async function POST(request: Request) {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const contractId = body.contractId?.trim();
  const subscription = body.subscription;
  const userId = resolveUserId(request, body);

  if (!contractId) {
    return NextResponse.json({ error: "Missing contractId" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!subscription?.endpoint || !subscription.keys?.auth || !subscription.keys?.p256dh) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  const totalSubscriptions = await savePushSubscription({
    contractId,
    userId,
    subscription,
  });

  return NextResponse.json({ ok: true, totalSubscriptions });
}
