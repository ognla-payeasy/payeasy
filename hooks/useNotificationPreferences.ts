"use client";

import { useEffect, useState } from "react";
import { useStellarAuth } from "@/contexts/StellarAuthContext";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/auth/users";

export function useNotificationPreferences() {
  const { publicKey } = useStellarAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!publicKey) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch("/api/user/notifications", {
      method: "GET",
      headers: { "x-user-id": publicKey },
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { notificationPreferences: NotificationPreferences }) => {
        if (!cancelled) setPreferences(data.notificationPreferences);
      })
      .catch(() => {
        if (!cancelled) setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  return { preferences, isLoading };
}
