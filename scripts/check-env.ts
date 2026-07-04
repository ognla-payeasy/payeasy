#!/usr/bin/env node
/**
 * Validates that all required environment variables are set before starting
 * the application. Run with: npx tsx scripts/check-env.ts
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  group: string;
}

const ENV_VARS: EnvVar[] = [
  // Auth
  { name: "AUTH_SECRET", required: true, description: "JWT signing secret (lib/auth/jwt.ts)", group: "Auth" },
  { name: "JWT_EXPIRY", required: false, description: "JWT expiry duration (default 7d)", group: "Auth" },

  // Database
  { name: "DATABASE_URL", required: true, description: "Postgres connection string (Prisma)", group: "Database" },
  { name: "DIRECT_URL", required: false, description: "Direct (non-pooled) Postgres URL for migrations", group: "Database" },

  // Stellar
  { name: "NEXT_PUBLIC_STELLAR_NETWORK", required: true, description: "Stellar network (testnet | mainnet)", group: "Stellar" },
  { name: "NEXT_PUBLIC_HORIZON_URL", required: true, description: "Horizon REST API base URL", group: "Stellar" },
  { name: "NEXT_PUBLIC_SOROBAN_RPC_URL", required: true, description: "Soroban RPC endpoint", group: "Stellar" },

  // Redis (Upstash REST)
  { name: "UPSTASH_REDIS_REST_URL", required: false, description: "Upstash Redis REST endpoint", group: "Redis" },
  { name: "UPSTASH_REDIS_REST_TOKEN", required: false, description: "Upstash Redis REST token", group: "Redis" },

  // Web Push
  { name: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", required: false, description: "VAPID public key for web push", group: "Web Push" },
  { name: "VAPID_PRIVATE_KEY", required: false, description: "VAPID private key for web push", group: "Web Push" },
  { name: "VAPID_SUBJECT", required: false, description: "VAPID contact (mailto: URL)", group: "Web Push" },

  // Email
  { name: "RESEND_API_KEY", required: false, description: "Resend API key for email", group: "Email" },
  { name: "RESEND_FROM_EMAIL", required: false, description: "From address for outgoing emails", group: "Email" },

  // Monitoring / Analytics
  { name: "SENTRY_DSN", required: false, description: "Sentry DSN for error reporting", group: "Monitoring" },
  { name: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN", required: false, description: "Plausible analytics domain", group: "Monitoring" },
  { name: "NEXT_PUBLIC_PLAUSIBLE_SRC", required: false, description: "Plausible script source URL", group: "Monitoring" },
];

function loadEnvFile(): Record<string, string> {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      const content = readFileSync(path, "utf-8");
      const vars: Record<string, string> = {};
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        vars[key] = value;
      }
      console.log(`Loaded env from ${file}\n`);
      return vars;
    }
  }
  console.log("No .env.local or .env file found — checking process.env only\n");
  return {};
}

function check(): void {
  const fileEnv = loadEnvFile();
  const env = { ...fileEnv, ...process.env };

  const missing: EnvVar[] = [];
  const warnings: string[] = [];
  let currentGroup = "";

  for (const v of ENV_VARS) {
    const value = env[v.name];
    const present = typeof value === "string" && value.trim().length > 0;

    if (v.group !== currentGroup) {
      currentGroup = v.group;
      console.log(`\n── ${v.group} ──`);
    }

    const tag = v.required ? "[REQUIRED]" : "[optional]";
    const status = present ? "✓" : v.required ? "✗" : "–";
    console.log(`  ${status} ${tag.padEnd(10)} ${v.name.padEnd(42)} ${v.description}`);

    if (!present) {
      if (v.required) {
        missing.push(v);
      } else {
        warnings.push(v.name);
      }
    }
  }

  console.log("");

  if (warnings.length > 0) {
    console.log(`Optional vars not set (${warnings.length}): ${warnings.join(", ")}`);
  }

  if (missing.length > 0) {
    console.error(`\nERROR: ${missing.length} required variable(s) are missing:`);
    for (const v of missing) {
      console.error(`  • ${v.name} — ${v.description}`);
    }
    console.error("\nCopy .env.example to .env.local and fill in the missing values.\n");
    process.exit(1);
  }

  console.log("\nAll required environment variables are set. ✓\n");
}

check();
