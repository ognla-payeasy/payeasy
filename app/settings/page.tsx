"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Save,
  Download,
  KeyRound,
} from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { usePreferences } from "@/hooks/usePreferences";
import { useToast } from "@/hooks/useToast";
import { useEmailAuth } from "@/context/EmailAuthContext";
import type { UserPreferences } from "@/lib/preferences/preferences";

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-canvas ${
          checked ? "bg-brand-600" : "bg-line"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Save Feedback Banner ─────────────────────────────────────────────────────

function SaveFeedbackBanner({
  saveStatus,
  saveError,
  onDismiss,
}: {
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, onDismiss]);

  if (saveStatus === "idle") return null;

  if (saveStatus === "saving") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Saving…
      </div>
    );
  }

  if (saveStatus === "saved") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-mint-500/30 bg-mint-500/10 px-4 py-3 text-sm text-mint-600">
        <CheckCircle2 className="h-4 w-4" />
        Settings saved successfully.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-600">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {saveError ?? "Failed to save settings. Please try again."}
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-soft space-y-5 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-brand-600">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-faint transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

// ─── Budget section ───────────────────────────────────────────────────────────

function BudgetSection({
  prefs,
  update,
}: {
  prefs: UserPreferences;
  update: (fn: (p: UserPreferences) => UserPreferences) => void;
}) {
  return (
    <Section title="Budget">
      <Field label="Currency">
        <select
          value={prefs.budget.currency}
          onChange={(e) =>
            update((p) => ({
              ...p,
              budget: {
                ...p.budget,
                currency: e.target.value as UserPreferences["budget"]["currency"],
              },
            }))
          }
          className={inputClass}
        >
          <option value="USD">USD — US Dollar</option>
          <option value="XLM">XLM — Stellar Lumens</option>
          <option value="USDC">USDC — USD Coin</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Min monthly rent">
          <input
            type="number"
            min={0}
            placeholder="e.g. 500"
            value={prefs.budget.minMonthly ?? ""}
            onChange={(e) =>
              update((p) => ({
                ...p,
                budget: {
                  ...p.budget,
                  minMonthly: e.target.value === "" ? null : Number(e.target.value),
                },
              }))
            }
            className={inputClass}
          />
        </Field>
        <Field label="Max monthly rent">
          <input
            type="number"
            min={0}
            placeholder="e.g. 2000"
            value={prefs.budget.maxMonthly ?? ""}
            onChange={(e) =>
              update((p) => ({
                ...p,
                budget: {
                  ...p.budget,
                  maxMonthly: e.target.value === "" ? null : Number(e.target.value),
                },
              }))
            }
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["petFriendly", "Pet friendly"],
            ["parking", "Parking"],
            ["laundryInUnit", "In-unit laundry"],
            ["furnished", "Furnished"],
          ] as [keyof UserPreferences["amenities"], string][]
        ).map(([key, label]) => (
          <Toggle
            key={key}
            checked={prefs.amenities[key]}
            label={label}
            onChange={(v) =>
              update((p) => ({
                ...p,
                amenities: { ...p.amenities, [key]: v },
              }))
            }
          />
        ))}
      </div>
    </Section>
  );
}

// ─── Location section ─────────────────────────────────────────────────────────

function LocationSection({
  prefs,
  update,
}: {
  prefs: UserPreferences;
  update: (fn: (p: UserPreferences) => UserPreferences) => void;
}) {
  return (
    <Section title="Location">
      <div className="grid grid-cols-2 gap-4">
        <Field label="City">
          <input
            type="text"
            placeholder="e.g. Austin"
            value={prefs.location.city}
            onChange={(e) =>
              update((p) => ({
                ...p,
                location: { ...p.location, city: e.target.value },
              }))
            }
            className={inputClass}
          />
        </Field>
        <Field label="State / Region">
          <input
            type="text"
            placeholder="e.g. TX"
            value={prefs.location.region}
            onChange={(e) =>
              update((p) => ({
                ...p,
                location: { ...p.location, region: e.target.value },
              }))
            }
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Max commute (minutes)">
        <input
          type="number"
          min={0}
          placeholder="e.g. 30"
          value={prefs.location.maxCommuteMins ?? ""}
          onChange={(e) =>
            update((p) => ({
              ...p,
              location: {
                ...p.location,
                maxCommuteMins: e.target.value === "" ? null : Number(e.target.value),
              },
            }))
          }
          className={`${inputClass} max-w-[180px]`}
        />
      </Field>
    </Section>
  );
}

// ─── Notifications section ────────────────────────────────────────────────────

function NotificationsSection({
  prefs,
  update,
}: {
  prefs: UserPreferences;
  update: (fn: (p: UserPreferences) => UserPreferences) => void;
}) {
  const n = prefs.notifications;
  return (
    <Section title="Notifications">
      <Toggle
        checked={n.escrowContributions}
        label="Contribution alerts"
        description="Notify when a roommate pays their share"
        onChange={(v) =>
          update((p) => ({
            ...p,
            notifications: { ...p.notifications, escrowContributions: v },
          }))
        }
      />
      <Toggle
        checked={n.escrowReleased}
        label="Release alerts"
        description="Notify when rent is released to the landlord"
        onChange={(v) =>
          update((p) => ({
            ...p,
            notifications: { ...p.notifications, escrowReleased: v },
          }))
        }
      />
      <Toggle
        checked={n.deadlineReminders}
        label="Deadline reminders"
        description="Remind before the payment deadline"
        onChange={(v) =>
          update((p) => ({
            ...p,
            notifications: { ...p.notifications, deadlineReminders: v },
          }))
        }
      />

      {n.deadlineReminders && (
        <Field label="Remind me">
          <select
            value={n.reminderDaysAhead}
            onChange={(e) =>
              update((p) => ({
                ...p,
                notifications: {
                  ...p.notifications,
                  reminderDaysAhead: Number(
                    e.target.value
                  ) as UserPreferences["notifications"]["reminderDaysAhead"],
                },
              }))
            }
            className={`${inputClass} max-w-[220px]`}
          >
            <option value={1}>1 day before deadline</option>
            <option value={3}>3 days before deadline</option>
            <option value={7}>7 days before deadline</option>
            <option value={14}>14 days before deadline</option>
          </select>
        </Field>
      )}
    </Section>
  );
}

// ─── Privacy section ──────────────────────────────────────────────────────────

function PrivacySection({
  prefs,
  update,
}: {
  prefs: UserPreferences;
  update: (fn: (p: UserPreferences) => UserPreferences) => void;
}) {
  const pv = prefs.privacy;
  return (
    <Section title="Privacy">
      <Toggle
        checked={pv.showPublicKeyInProfile}
        label="Show wallet address in profile"
        description="Other users can see your Stellar public key"
        onChange={(v) =>
          update((p) => ({
            ...p,
            privacy: { ...p.privacy, showPublicKeyInProfile: v },
          }))
        }
      />
      <Toggle
        checked={pv.shareActivityWithRoommates}
        label="Share activity with roommates"
        description="Roommates can see your payment history"
        onChange={(v) =>
          update((p) => ({
            ...p,
            privacy: { ...p.privacy, shareActivityWithRoommates: v },
          }))
        }
      />
      <Toggle
        checked={pv.analyticsOptIn}
        label="Usage analytics"
        description="Help improve PayEasy by sharing anonymous usage data"
        onChange={(v) =>
          update((p) => ({
            ...p,
            privacy: { ...p.privacy, analyticsOptIn: v },
          }))
        }
      />
    </Section>
  );
}

// ─── Password section ────────────────────────────────────────────────────────

function PasswordSection() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update password.");
      }

      resetForm();
      toast.success("Password updated successfully.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section title="Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Current password">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>
        <Field label="New password">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-pill btn-pill-ghost w-full sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </Section>
  );
}

// ─── Data Export (GDPR) ───────────────────────────────────────────────────────

function DataExportSection() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);

      const res = await fetch("/api/user/export", {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await res.json();

      const dateStr = new Date().toISOString().split("T")[0];
      const emailSafe = data.email ? data.email.replace(/[^a-zA-Z0-9@.-]/g, "") : "user";
      const filename = `payeasy-data-${emailSafe}-${dateStr}.json`;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again later.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Section title="Data & Privacy">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-ink">Download my data</p>
          <p className="mt-0.5 text-xs text-muted">
            Export a JSON copy of your personal account data and preferences.
          </p>
        </div>
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="btn-pill btn-pill-ghost w-full sm:w-auto"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "Exporting…" : "Download data"}
        </button>
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useEmailAuth();
  const { isConnected } = useWalletConnection();

  const { preferences, setPreferences, save, reset, saveStatus, saveError } =
    usePreferences();

  const [bannerStatus, setBannerStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      router.push("/connect");
    }
  }, [isConnected, router]);

  useEffect(() => {
    setBannerStatus(saveStatus);
    setBannerError(saveError);
  }, [saveStatus, saveError]);

  const dismissBanner = useCallback(() => setBannerStatus("idle"), []);

  if (isLoading || !isConnected || !user) return null;

  return (
    <main
      aria-label="Account settings"
      className="brand-canvas min-h-screen"
    >
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Settings className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Settings</h1>
        </div>

        <SaveFeedbackBanner
          saveStatus={bannerStatus}
          saveError={bannerError}
          onDismiss={dismissBanner}
        />

        <BudgetSection prefs={preferences} update={setPreferences} />
        <LocationSection prefs={preferences} update={setPreferences} />
        <NotificationsSection prefs={preferences} update={setPreferences} />
        <PrivacySection prefs={preferences} update={setPreferences} />
        <PasswordSection />
        <DataExportSection />

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            onClick={save}
            className="btn-pill btn-pill-primary w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            Save settings
          </button>
          <button
            onClick={reset}
            className="btn-pill btn-pill-ghost w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to defaults
          </button>
        </div>
      </div>
    </main>
  );
}
