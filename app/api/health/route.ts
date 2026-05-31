import { NextResponse } from "next/server";

const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";

const START_TIME = Date.now();

async function checkHorizon(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(HORIZON_URL, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const horizonOk = await checkHorizon();

  const body = {
    status: horizonOk ? "ok" : "degraded",
    version: process.env.npm_package_version ?? "1.0.0",
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    timestamp: new Date().toISOString(),
    checks: {
      horizon: horizonOk ? "reachable" : "unreachable",
    },
  };

  return NextResponse.json(body, { status: horizonOk ? 200 : 503 });
}
