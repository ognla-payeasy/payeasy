"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Wallet, History, Settings } from "lucide-react";
import { useScrollDirection } from "@/hooks/useScrollDirection";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Escrows", href: "/escrow/create", icon: Shield },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed bottom-0 inset-x-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${
        scrollDirection === "down" ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-around bg-[#0a0a0f]/95 backdrop-blur-md border-t border-white/10 px-1 py-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors min-w-0 ${
                isActive
                  ? "text-brand-400"
                  : "text-white/40 hover:text-white/70"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
