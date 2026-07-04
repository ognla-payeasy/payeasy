import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type StoredUser,
  type WebAuthnCredentialJSON,
} from "./user-types";

// Re-export the client-safe types and pure helpers so existing server-side
// imports from "@/lib/auth/users" keep working. Client code should import
// these from "@/lib/auth/user-types" instead (this module is server-only).
export {
  DEFAULT_NOTIFICATION_PREFERENCES,
  toPublicUser,
  isValidNotificationPatch,
} from "./user-types";
export type {
  NotificationPreferences,
  WebAuthnCredentialJSON,
  StoredUser,
  PublicUser,
} from "./user-types";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Maps a Prisma User row to the app's StoredUser shape. */
function toStoredUser(row: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  emailVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpiresAt: Date | null;
  notificationPreferences: Prisma.JsonValue | null;
  currentChallenge: string | null;
  webAuthnCredentials: Prisma.JsonValue | null;
}): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
    emailVerified: row.emailVerified,
    verificationToken: row.verificationToken ?? undefined,
    verificationTokenExpiresAt:
      row.verificationTokenExpiresAt?.toISOString() ?? undefined,
    notificationPreferences:
      (row.notificationPreferences as NotificationPreferences | null) ??
      undefined,
    currentChallenge: row.currentChallenge ?? undefined,
    webAuthnCredentials:
      (row.webAuthnCredentials as WebAuthnCredentialJSON[] | null) ?? undefined,
  };
}

export async function findUserByEmail(
  email: string
): Promise<StoredUser | undefined> {
  const row = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  return row ? toStoredUser(row) : undefined;
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toStoredUser(row) : undefined;
}

export async function findUserByVerificationToken(
  token: string
): Promise<StoredUser | undefined> {
  const row = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiresAt: { gt: new Date() },
    },
  });
  return row ? toStoredUser(row) : undefined;
}

export async function verifyEmailToken(
  token: string
): Promise<StoredUser | null> {
  const row = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiresAt: { gt: new Date() },
    },
  });
  if (!row) return null;

  const updated = await prisma.user.update({
    where: { id: row.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  });
  return toStoredUser(updated);
}

export async function createUser(
  email: string,
  name: string,
  passwordHash: string
): Promise<StoredUser> {
  const row = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      emailVerified: false,
      verificationToken: randomUUID(),
      verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      notificationPreferences:
        DEFAULT_NOTIFICATION_PREFERENCES as unknown as Prisma.InputJsonValue,
    },
  });
  return toStoredUser(row);
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const user = await findUserById(userId);
  return user?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current =
    (await getNotificationPreferences(userId)) ??
    DEFAULT_NOTIFICATION_PREFERENCES;
  const updated: NotificationPreferences = { ...current, ...patch };

  await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreferences: updated as unknown as Prisma.InputJsonValue,
    },
  });
  return updated;
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string
): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function updateUser(
  userId: string,
  patch: Partial<StoredUser>
): Promise<StoredUser> {
  const data: Prisma.UserUpdateInput = {};

  if ("name" in patch) data.name = patch.name;
  if ("email" in patch) data.email = patch.email?.toLowerCase().trim();
  if ("passwordHash" in patch) data.passwordHash = patch.passwordHash;
  if ("emailVerified" in patch) data.emailVerified = patch.emailVerified;
  if ("verificationToken" in patch)
    data.verificationToken = patch.verificationToken ?? null;
  if ("verificationTokenExpiresAt" in patch)
    data.verificationTokenExpiresAt = patch.verificationTokenExpiresAt
      ? new Date(patch.verificationTokenExpiresAt)
      : null;
  if ("currentChallenge" in patch)
    data.currentChallenge = patch.currentChallenge ?? null;
  if ("notificationPreferences" in patch)
    data.notificationPreferences = patch.notificationPreferences
      ? (patch.notificationPreferences as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull;
  if ("webAuthnCredentials" in patch)
    data.webAuthnCredentials = patch.webAuthnCredentials
      ? (patch.webAuthnCredentials as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull;

  const row = await prisma.user.update({ where: { id: userId }, data });
  return toStoredUser(row);
}
