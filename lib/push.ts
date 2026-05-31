import webPush from "web-push";
import { Redis } from "@upstash/redis";

export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface StoredSubscriptions {
  [userId: string]: PushSubscriptionRecord;
}

interface ReminderPayload {
  contractId: string;
  title: string;
  body: string;
  url: string;
}

let configured = false;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

function getSubscriptionsKey(contractId: string): string {
  return `payeasy:push:subscriptions:${contractId}`;
}

function configureWebPush(): void {
  if (configured) {
    return;
  }

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return;
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

async function readStoredSubscriptions(contractId: string): Promise<StoredSubscriptions> {
  const redis = getRedis();
  if (!redis) {
    return {};
  }

  const stored = await redis.get<StoredSubscriptions>(getSubscriptionsKey(contractId));
  return stored ?? {};
}

async function writeStoredSubscriptions(contractId: string, subscriptions: StoredSubscriptions): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  await redis.set(getSubscriptionsKey(contractId), subscriptions);
}

export async function savePushSubscription(params: {
  contractId: string;
  userId: string;
  subscription: PushSubscriptionRecord;
}): Promise<number> {
  const stored = await readStoredSubscriptions(params.contractId);
  stored[params.userId] = params.subscription;
  await writeStoredSubscriptions(params.contractId, stored);
  return Object.keys(stored).length;
}

export async function listPushSubscriptions(contractId: string): Promise<Array<{ userId: string; subscription: PushSubscriptionRecord }>> {
  const stored = await readStoredSubscriptions(contractId);
  return Object.entries(stored).map(([userId, subscription]) => ({ userId, subscription }));
}

export async function sendPaymentReminder(payload: ReminderPayload): Promise<{ delivered: number; failed: number }> {
  configureWebPush();

  const subscriptions = await listPushSubscriptions(payload.contractId);
  if (subscriptions.length === 0) {
    return { delivered: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    subscriptions.map(({ subscription }) =>
      webPush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url,
        })
      )
    )
  );

  let delivered = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      delivered += 1;
    } else {
      failed += 1;
    }
  }

  return { delivered, failed };
}

export function isReminderWindow(deadlineEpoch: number): boolean {
  const nowEpoch = Math.floor(Date.now() / 1000);
  const reminderWindowStart = deadlineEpoch - 72 * 60 * 60;
  return nowEpoch >= reminderWindowStart && nowEpoch <= deadlineEpoch;
}
