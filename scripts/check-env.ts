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
  { name: "JWT_SECRET", required: true, description: "JWT signing secret", group: "Auth" },
  { name: "JWT_EXPIRES_IN", required: false, description: "JWT expiry duration", group: "Auth" },

  // Stellar
  { name: "NEXT_PUBLIC_STELLAR_NETWORK", required: true, description: "Stellar network (testnet | mainnet)", group: "Stellar" },
  { name: "NEXT_PUBLIC_HORIZON_URL", required: true, description: "Horizon REST API base URL", group: "Stellar" },
  { name: "NEXT_PUBLIC_SOROBAN_RPC_URL", required: true, description: "Soroban RPC endpoint", group: "Stellar" },
  { name: "NEXT_PUBLIC_ESCROW_CONTRACT_ID", required: false, description: "Deployed escrow contract ID", group: "Stellar" },
  { name: "STELLAR_FEE_BUMP_SOURCE", required: false, description: "Fee-bump source account address", group: "Stellar" },
  { name: "STELLAR_FEE_BUMP_SECRET", required: false, description: "Fee-bump source secret key", group: "Stellar" },

  // Database
  { name: "MONGODB_URI", required: true, description: "MongoDB Atlas connection string", group: "Database" },
  { name: "MONGODB_DB_NAME", required: false, description: "MongoDB database name", group: "Database" },

  // Redis
  { name: "REDIS_URL", required: false, description: "Redis connection URL", group: "Redis" },
  { name: "REDIS_TTL", required: false, description: "Redis key TTL in seconds", group: "Redis" },

  // Feature Flags
  { name: "NEXT_PUBLIC_FEATURE_ROOMMATE_MATCHING", required: false, description: "Enable roommate matching", group: "Feature Flags" },
  { name: "NEXT_PUBLIC_FEATURE_MESSAGING", required: false, description: "Enable in-app messaging", group: "Feature Flags" },
  { name: "NEXT_PUBLIC_FEATURE_HISTORY_EXPORT", required: false, description: "Enable history export", group: "Feature Flags" },

  // Monitoring
  { name: "SENTRY_DSN", required: false, description: "Sentry DSN for error reporting", group: "Monitoring" },
  { name: "SENTRY_ENVIRONMENT", required: false, description: "Sentry environment tag", group: "Monitoring" },
  { name: "RESEND_API_KEY", required: false, description: "Resend API key for email", group: "Monitoring" },
  { name: "RESEND_FROM_EMAIL", required: false, description: "From address for outgoing emails", group: "Monitoring" },
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
