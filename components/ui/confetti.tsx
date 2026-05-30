"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  /**
   * Optional delay before the confetti starts (in ms)
   */
  delay?: number;
}

/**
 * Confetti component that triggers a burst animation on mount.
 * Respects 'prefers-reduced-motion' accessibility setting.
 */
export default function Confetti({ delay = 0 }: ConfettiProps) {
  useEffect(() => {
    // Skip if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const colors = ["#5c7cfa", "#20c997", "#748ffc"];

    const timer = setTimeout(() => {
      void confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
        disableForReducedMotion: true,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return null;
}
