"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getDefinition, type GlossaryLocale } from "@/lib/glossary";

interface GlossaryTermProps {
  term: string;
  children: React.ReactNode;
  locale?: GlossaryLocale;
}

export function GlossaryTerm({ term, children, locale }: GlossaryTermProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectedLocale: GlossaryLocale =
    locale ?? (pathname.startsWith("/es") ? "es" : "en");
  const definition = getDefinition(term, detectedLocale);

  if (!definition) return <>{children}</>;

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setIsVisible(false), 100);
  };

  const tooltipId = `glossary-${term.replace(/\s+/g, "-")}`;

  return (
    <span className="relative inline-block">
      <span
        className="border-b border-dashed border-brand-400 cursor-help"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        role="button"
        aria-describedby={tooltipId}
      >
        {children}
      </span>
      {isVisible && (
        <span
          id={tooltipId}
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-lg glass text-xs text-white z-50 pointer-events-auto"
          style={{ whiteSpace: "normal" }}
        >
          <strong className="block mb-1 text-brand-400">{term}</strong>
          {definition}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: "rgba(255,255,255,0.08)" }}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
