"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card text-muted transition-colors hover:text-ink ${className}`}
    >
      {/* Render the icon only after mount so SSR and client agree. */}
      {mounted ? (
        isDark ? <Sun size={16} /> : <Moon size={16} />
      ) : (
        <Moon size={16} className="opacity-0" />
      )}
    </button>
  );
}
