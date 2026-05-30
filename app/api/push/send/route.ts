import { NextResponse } from "next/server";
import { isReminderWindow, sendPaymentReminder } from "@/lib/push";

interface SendBody {
  contractId?: string;
  deadlineEpoch?: number;
  title?: string;
  body?: string;
  url?: string;
}

export async function POST(request: Request) {
  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const contractId = body.contractId?.trim();
  const deadlineEpoch = body.deadlineEpoch;

  if (!contractId || typeof deadlineEpoch !== "number") {
    return NextResponse.json({ error: "Missing contractId or deadlineEpoch" }, { status: 400 });
  }

  if (!isReminderWindow(deadlineEpoch)) {
    return NextResponse.json({ error: "Deadline is outside the reminder window" }, { status: 400 });
  }

  const result = await sendPaymentReminder({
    contractId,
    title: body.title ?? "Rent deadline approaching",
    body: body.body ?? "Your escrow payment deadline is coming up soon.",
    url: body.url ?? `/pay/${contractId}`,
  });

  return NextResponse.json(result);
}
