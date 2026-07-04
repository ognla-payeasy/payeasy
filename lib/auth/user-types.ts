/**
 * Client-safe user types and pure helpers.
 *
 * This module must not import any server-only code (Prisma, fs, …) so it can be
 * imported from client components and hooks. The database-backed functions live
 * in ./users.ts (server-only).
 */

export interface NotificationPreferences {
  marketingEmails: boolean;
  securityAlerts: boolean;
  pushNotifications: boolean;
}

export interface WebAuthnCredentialJSON {
  id: string;
  publicKeyBase64: string;
  counter: number;
  transports?: string[];
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
  notificationPreferences?: NotificationPreferences;
  currentChallenge?: string;
  webAuthnCredentials?: WebAuthnCredentialJSON[];
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  marketingEmails: false,
  securityAlerts: true,
  pushNotifications: true,
};

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
  };
}

export function isValidNotificationPatch(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;

  const validKeys = ["marketingEmails", "securityAlerts", "pushNotifications"];
  const patch = body as Record<string, unknown>;

  for (const key of Object.keys(patch)) {
    if (!validKeys.includes(key) || typeof patch[key] !== "boolean") {
      return false;
    }
  }

  return true;
}
