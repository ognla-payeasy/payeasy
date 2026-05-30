import { SignJWT, jwtVerify } from "jose";

const DEV_SECRET_PLACEHOLDER = "payeasy-dev-secret-change-in-production-32chars";

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Validates that AUTH_SECRET is not set to the development placeholder.
 * This check runs once on module load to fail fast in production deployments.
 */
function validateAuthSecret(): void {
  const secret = process.env.AUTH_SECRET;
  
  if (secret === DEV_SECRET_PLACEHOLDER) {
    throw new Error(
      "\n" +
      "=== SECURITY ERROR ===\n" +
      "AUTH_SECRET is set to the development placeholder.\n" +
      "This value must be changed for production deployments.\n" +
      "\n" +
      "To fix:\n" +
      "1. Generate a new 32+ character random secret:\n" +
      "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
      "2. Set AUTH_SECRET to this value in your production environment\n" +
      "3. DO NOT commit secrets to version control\n" +
      "\n" +
      "Secret rotation procedure:\n" +
      "- Generate new SECRET_KEY\n" +
      "- Update AUTH_SECRET in production environment\n" +
      "- Existing tokens will become invalid (users will need to re-login)\n" +
      "- Sessions cannot be maintained across secret rotation\n" +
      "========================\n"
    );
  }
}

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(s);
}

/**
 * Gets the JWT expiration time from environment or default.
 * Format: "7d", "24h", "1h", "30m", etc.
 */
function getTokenExpiry(): string {
  return process.env.JWT_EXPIRY || "7d";
}

export async function signToken(payload: AuthPayload): Promise<string> {
  // Validate secret on first token generation
  validateAuthSecret();

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getTokenExpiry())
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expiring within the given number of seconds.
 * @param token The JWT token string
 * @param withinSeconds Number of seconds to check (default: 86400 = 24 hours)
 * @returns true if token expires within the given time window, false if valid or expired
 */
export async function isTokenExpiringWithin(
  token: string,
  withinSeconds: number = 86400 // 24 hours
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const authPayload = payload as unknown as AuthPayload;

    if (!authPayload.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = authPayload.exp - now;

    // Token is expiring within window and not already expired
    return expiresIn > 0 && expiresIn <= withinSeconds;
  } catch {
    return false;
  }
}

/**
 * Checks if a token is fully expired.
 * @param token The JWT token string
 * @returns true if token is expired, false otherwise
 */
export async function isTokenExpired(token: string): Promise<boolean> {
  return (await verifyToken(token)) === null;
}
