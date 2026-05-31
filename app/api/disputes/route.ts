import { NextRequest, NextResponse } from "next/server";

interface DisputeRecord {
  contractId: string;
  roommateAddress: string;
  flaggedAt: number;
}

// In-memory store — resets on server restart, sufficient for demo/testnet use.
const disputes = new Map<string, DisputeRecord[]>();

export async function POST(request: NextRequest) {
  let body: { contractId?: string; roommateAddress?: string };

  try {
    body = (await request.json()) as {
      contractId?: string;
      roommateAddress?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { contractId, roommateAddress } = body;

  if (!contractId || !roommateAddress) {
    return NextResponse.json(
      { error: "contractId and roommateAddress are required." },
      { status: 400 }
    );
  }

  const record: DisputeRecord = {
    contractId,
    roommateAddress,
    flaggedAt: Date.now(),
  };

  const existing = disputes.get(contractId) ?? [];
  disputes.set(contractId, [...existing, record]);

  return NextResponse.json({ success: true, record }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const contractId = request.nextUrl.searchParams.get("contractId");

  if (!contractId) {
    return NextResponse.json(
      { error: "contractId query parameter is required." },
      { status: 400 }
    );
  }

  const records = disputes.get(contractId) ?? [];
  return NextResponse.json({ disputes: records });
}
