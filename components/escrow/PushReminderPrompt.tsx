"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";

interface PushReminderPromptProps {
  contractId: string;
  roommateAddress: string;
}

function base64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
}

export default function PushReminderPrompt({ contractId, roommateAddress }: PushReminderPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const permission = typeof Notification !== "undefined" ? Notification.permission : "denied";
    const storageKey = `payeasy:push-opt-in:${contractId}:${roommateAddress}`;
    const alreadyOptedIn = window.localStorage.getItem(storageKey) === "true";
    setIsEnabled(alreadyOptedIn || permission === "granted");
    setIsVisible(!alreadyOptedIn && permission !== "denied");
  }, [contractId, roommateAddress]);

  async function enableReminders() {
    try {
      setIsEnabling(true);
      setError(null);

      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        throw new Error("This browser does not support push notifications.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("Missing VAPID public key.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(vapidKey),
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": roommateAddress,
        },
        body: JSON.stringify({ contractId, subscription }),
      });

      if (!response.ok) {
        throw new Error("Failed to save the push subscription.");
      }

      window.localStorage.setItem(`payeasy:push-opt-in:${contractId}:${roommateAddress}`, "true");
      setIsVisible(false);
      setIsEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enable reminders.");
    } finally {
      setIsEnabling(false);
    }
  }

  if (!isVisible || isEnabled) {
    return null;
  }

  return (
    <div className="glass-card flex flex-col gap-4 border border-brand-500/20 bg-brand-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-2 text-brand-300">
          <BellRing className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white">Enable deadline reminders</h3>
          <p className="text-sm text-brand-100/80">
            Get a push notification when your escrow deadline is approaching.
          </p>
          {error && <p className="text-xs text-red-200">{error}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void enableReminders()}
        disabled={isEnabling}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-dark-950 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isEnabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {isEnabling ? "Enabling..." : "Enable notifications"}
      </button>
    </div>
  );
}
