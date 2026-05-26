"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Clock, CheckCircle2, RefreshCcw, Settings as SettingsIcon } from "lucide-react";
import { useStellarAuth } from "@/contexts/StellarAuthContext";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from "@/lib/auth/users";

interface ToggleOption {
  key: NotificationPreferenceKey;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TOGGLE_OPTIONS: ToggleOption[] = [
  {
    key: "deadlineReminders",
    label: "Escrow deadline reminders",
    description:
      "Get notified as a contribution deadline approaches for any escrow you are part of.",
    icon: Clock,
  },
  {
    key: "paymentConfirmed",
    label: "Payment confirmed",
    description:
      "Receive alerts when an escrow you funded reaches its target and payment is confirmed.",
    icon: CheckCircle2,
  },
  {
    key: "refundAvailable",
    label: "Refund available",
    description:
      "Be notified when an expired escrow makes your contribution refundable.",
    icon: RefreshCcw,
  },
];

export default function SettingsPage() {
  const { publicKey, isConnected } = useStellarAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<NotificationPreferenceKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicKey) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/notifications", {
          method: "GET",
          headers: { "x-user-id": publicKey },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as { notificationPreferences: NotificationPreferences };
        if (!cancelled) setPreferences(data.notificationPreferences);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load preferences");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const handleToggle = useCallback(
    async (key: NotificationPreferenceKey) => {
      if (!publicKey) {
        setError("Connect a wallet to save preferences.");
        return;
      }
      const nextValue = !preferences[key];
      const previous = preferences;
      setPreferences({ ...preferences, [key]: nextValue });
      setSavingKey(key);
      setError(null);
      try {
        const res = await fetch("/api/user/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": publicKey,
          },
          body: JSON.stringify({ [key]: nextValue }),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as { notificationPreferences: NotificationPreferences };
        setPreferences(data.notificationPreferences);
      } catch (err) {
        setPreferences(previous);
        setError(err instanceof Error ? err.message : "Failed to save preference");
      } finally {
        setSavingKey(null);
      }
    },
    [preferences, publicKey],
  );

  return (
    <main className="min-h-screen pt-28 pb-20 relative overflow-hidden bg-[#0a0a0f]">
      <div className="mesh-gradient opacity-40 mix-blend-screen pointer-events-none fixed inset-0" />
      <div className="container relative z-10 mx-auto px-6 max-w-4xl">
        <header className="mb-12 space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-black uppercase tracking-[0.2em] shadow-inner backdrop-blur-md">
            <SettingsIcon className="h-4 w-4" />
            Account Settings
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-[0.95]">
            Preferences
          </h1>
          <p className="text-dark-500 text-base max-w-2xl">
            Choose which on-chain events should alert you. Changes save instantly to your account.
          </p>
        </header>

        <section
          aria-labelledby="notifications-heading"
          className="rounded-2xl border border-white/10 bg-dark-900/60 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
            <Bell className="h-5 w-5 text-brand-400" />
            <h2 id="notifications-heading" className="text-lg font-bold text-white">
              Notifications
            </h2>
          </div>

          {!isConnected && (
            <div className="px-6 py-4 text-sm text-amber-300 bg-amber-500/5 border-b border-amber-500/20">
              Connect your wallet to load and update your notification preferences.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="px-6 py-4 text-sm text-red-300 bg-red-500/5 border-b border-red-500/20"
            >
              {error}
            </div>
          )}

          <ul className="divide-y divide-white/5">
            {TOGGLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const checked = preferences[option.key];
              const disabled = !publicKey || isLoading || savingKey === option.key;
              return (
                <li
                  key={option.key}
                  className="flex items-start gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10 text-brand-300">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="text-xs text-dark-400 mt-1 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={option.label}
                    data-testid={`notification-toggle-${option.key}`}
                    disabled={disabled}
                    onClick={() => handleToggle(option.key)}
                    className={`relative shrink-0 mt-1 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                      checked ? "bg-brand-500" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
