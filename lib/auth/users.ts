export type NotificationPreferenceKey =
  | "deadlineReminders"
  | "paymentConfirmed"
  | "refundAvailable";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export interface User {
  id: string;
  notificationPreferences: NotificationPreferences;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  deadlineReminders: true,
  paymentConfirmed: true,
  refundAvailable: true,
};

const NOTIFICATION_KEYS: NotificationPreferenceKey[] = [
  "deadlineReminders",
  "paymentConfirmed",
  "refundAvailable",
];

const globalKey = "__payeasy_user_store__";
const globalAny = globalThis as unknown as { [globalKey]?: Map<string, User> };
if (!globalAny[globalKey]) {
  globalAny[globalKey] = new Map<string, User>();
}
const store: Map<string, User> = globalAny[globalKey]!;

export function getUser(userId: string): User {
  const existing = store.get(userId);
  if (existing) return existing;
  const created: User = {
    id: userId,
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
  };
  store.set(userId, created);
  return created;
}

export function getNotificationPreferences(userId: string): NotificationPreferences {
  return { ...getUser(userId).notificationPreferences };
}

export function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>,
): NotificationPreferences {
  const user = getUser(userId);
  const sanitized: Partial<NotificationPreferences> = {};
  for (const key of NOTIFICATION_KEYS) {
    if (key in patch && typeof patch[key] === "boolean") {
      sanitized[key] = patch[key];
    }
  }
  user.notificationPreferences = {
    ...user.notificationPreferences,
    ...sanitized,
  };
  store.set(userId, user);
  return { ...user.notificationPreferences };
}

export function isValidNotificationPatch(
  value: unknown,
): value is Partial<NotificationPreferences> {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!NOTIFICATION_KEYS.includes(key as NotificationPreferenceKey)) return false;
    if (typeof obj[key] !== "boolean") return false;
  }
  return true;
}
