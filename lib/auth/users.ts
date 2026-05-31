import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");

export interface NotificationPreferences {
  marketingEmails: boolean;
  securityAlerts: boolean;
  pushNotifications: boolean;
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  notificationPreferences?: NotificationPreferences; // Added to store preferences
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  marketingEmails: false,
  securityAlerts: true,
  pushNotifications: true,
};

function readUsers(): StoredUser[] {
  if (!existsSync(USERS_FILE)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(USERS_FILE, "[]");
    return [];
  }
  return JSON.parse(readFileSync(USERS_FILE, "utf-8")) as StoredUser[];
}

function writeUsers(users: StoredUser[]): void {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return readUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function findUserById(id: string): StoredUser | undefined {
  return readUsers().find((u) => u.id === id);
}

export function createUser(
  email: string,
  name: string,
  passwordHash: string
): StoredUser {
  const users = readUsers();
  const user: StoredUser = {
    id: randomUUID(),
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES, // Apply defaults on creation
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

// ---------------------------------------------------------------------------
// Notification Preference Functions
// ---------------------------------------------------------------------------

export function getNotificationPreferences(userId: string): NotificationPreferences {
  const user = findUserById(userId);
  // Return the user's saved preferences, or defaults if they don't have any yet
  return user?.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;
}

export function isValidNotificationPatch(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;

  const validKeys = ['marketingEmails', 'securityAlerts', 'pushNotifications'];
  const patch = body as Record<string, unknown>;

  for (const key of Object.keys(patch)) {
    // If the key isn't allowed, or the value isn't a boolean, reject it
    if (!validKeys.includes(key) || typeof patch[key] !== 'boolean') {
      return false;
    }
  }

  return true;
}

export function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>
): NotificationPreferences {
  const users = readUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  const currentPrefs = users[userIndex].notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;
  const updatedPrefs = { ...currentPrefs, ...patch };

  // Update the user in the array and write back to the JSON file
  users[userIndex].notificationPreferences = updatedPrefs;
  writeUsers(users);

  return updatedPrefs;
}

export function updateUserPasswordHash(userId: string, passwordHash: string): void {
  const users = readUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  users[userIndex].passwordHash = passwordHash;
  writeUsers(users);
}
