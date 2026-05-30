import { NextRequest, NextResponse } from "next/server";

/** Shape of the Web Vitals metric payload sent from the client. */
export interface VitalsPayload {
  /** Metric identifier, e.g. "LCP", "FID", "CLS", "TTFB", "INP". */
  name: string;
  /** Numeric value of the metric (milliseconds for time-based, unitless for CLS). */
  value: number;
  /** Unique ID for this metric instance, stable across re-renders. */
  id: string;
  /** Metric category: "web-vital" | "custom". */
  label?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).name !== "string" ||
    typeof (body as Record<string, unknown>).value !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: name, value" },
      { status: 400 }
    );
  }

  const metric = body as VitalsPayload;

  // Log in development for easy inspection.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[vitals] ${metric.name}=${metric.value} id=${metric.id ?? "?"}`);
  }

  return NextResponse.json({ ok: true });
}