"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogIn, UserPlus, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { useActiveSection } from "@/hooks/useActiveSection";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEmailAuth } from "@/context/EmailAuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useEmailAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeSection = useActiveSection(["features", "how-it-works", "stellar"]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Stellar", href: "#stellar" },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass py-3 shadow-lg shadow-black/20"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center transition-transform group-hover:scale-110">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Pay<span className="gradient-text">Easy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.replace("#", "");
            return (
              <a
                key={link.name}
                href={link.href}
                className={`relative text-sm font-medium transition-all duration-300 ${
                  isActive ? "text-white" : "text-dark-400 hover:text-white"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-500 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
                )}
              </a>
            );
          })}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <User size={14} className="text-brand-400" />
                <span className="text-sm text-dark-200 font-medium max-w-[120px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn-secondary !py-2.5 !px-4 !text-sm !rounded-lg flex items-center gap-1.5"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-secondary !py-2.5 !px-5 !text-sm !rounded-lg flex items-center gap-1.5"
                onMouseEnter={() => router.prefetch("/login")}
              >
                <LogIn size={14} />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                onMouseEnter={() => router.prefetch("/signup")}
              >
                <UserPlus size={14} />
                Sign Up
              </Link>
            </>
          )}
          <ConnectWalletButton />
          <ThemeToggle />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass mt-2 mx-4 rounded-2xl p-6 animate-fade-in">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-dark-300 hover:text-white transition-colors py-2 text-lg font-medium"
              >
                {link.name}
              </a>
            ))}
            <div className="h-px bg-white/10 my-2" />
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <User size={14} className="text-brand-400" />
                  <span className="text-sm text-dark-200 font-medium truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="btn-secondary !justify-center flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-secondary !justify-center flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn size={14} />
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserPlus size={14} />
                  Sign Up
                </Link>
              </>
            )}
            <div className="flex justify-center gap-3">
              <ConnectWalletButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
