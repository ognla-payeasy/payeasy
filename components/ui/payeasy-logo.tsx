"use client";

import React from "react";

interface PayEasyLogoProps {
  size?: number;
  className?: string;
  /** Color of the "Pay" wordmark. Defaults to warm ink for light backgrounds. */
  wordmarkColor?: string;
}

export function PayEasyLogo({
  size = 32,
  className,
  wordmarkColor = "#12141a",
}: PayEasyLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {/* Logo Mark — rounded home + coin */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Rounded tile */}
        <rect x="2" y="2" width="36" height="36" rx="11" fill="#2f5bff" />
        {/* Roof / home mark */}
        <path
          d="M12 20.5L20 13L28 20.5"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Coin / dollar */}
        <path
          d="M20 19.5V21M20 27V28.5M17.5 24.2c0 1.3 1.1 2.1 2.5 2.1s2.5-.7 2.5-1.9c0-1.3-1.1-1.7-2.5-2s-2.5-.7-2.5-1.9c0-1.2 1.1-1.9 2.5-1.9s2.5.8 2.5 2"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Coral accent node */}
        <circle cx="30" cy="11" r="3" fill="#ff6b4a" stroke="#ffffff" strokeWidth="1.5" />
      </svg>

      {/* Wordmark */}
      <span
        className="font-display"
        style={{
          fontWeight: 800,
          fontSize: `${size * 0.62}px`,
          letterSpacing: "-0.045em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: wordmarkColor }}>Pay</span>
        <span style={{ color: "#2f5bff" }}>Easy</span>
      </span>
    </div>
  );
}
