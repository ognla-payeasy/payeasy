"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
] as const;

type LanguageCode = (typeof languages)[number]["code"];

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const currentLocale: LanguageCode = pathname.startsWith("/es") ? "es" : "en";
  const current = languages.find((l) => l.code === currentLocale) ?? languages[0];

  useEffect(() => {
    const saved = localStorage.getItem("preferred-locale") as LanguageCode | null;
    if (saved && saved !== currentLocale && pathname === "/") {
      router.push(saved === "es" ? "/es" : "/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    localStorage.setItem("preferred-locale", code);
    router.push(code === "es" ? "/es" : "/");
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-dark-400 hover:text-white transition-colors text-sm font-medium"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">{current.flag}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Available languages"
          className="absolute right-0 top-full mt-2 glass rounded-xl py-1 min-w-[140px] z-50 shadow-lg"
        >
          {languages.map((lang) => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === currentLocale}
              onClick={() => handleSelect(lang.code)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span aria-hidden="true">{lang.flag}</span>
              <span>{lang.name}</span>
              {lang.code === currentLocale && (
                <svg
                  className="ml-auto"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
