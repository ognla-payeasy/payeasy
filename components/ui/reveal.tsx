"use client";

import React, { useEffect, useRef } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms, applied as a CSS transition-delay. */
  delay?: number;
  /** Render element tag. Defaults to a div. */
  as?: "div" | "section" | "li" | "span" | "header";
}

/**
 * Scroll-reveal wrapper. Content fades and rises into place as it enters the
 * viewport (à la GSAP ScrollTrigger reveals). Progressive enhancement: the
 * hidden state only applies once JS has marked the document ready, so content
 * is fully visible with JS off or reduced-motion on.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-reveal-ready", "");
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return React.createElement(
    as,
    {
      ref,
      className: `reveal ${className}`,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children
  );
}
