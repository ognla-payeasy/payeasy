import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — confident "slush" blue
        brand: {
          50: "#eef2ff",
          100: "#e7ecff",
          200: "#c7d2ff",
          300: "#a5b4ff",
          400: "#6b86ff",
          500: "#2f5bff",
          600: "#234ce0",
          700: "#1e40c8",
          800: "#1b39a8",
          900: "#1a3488",
        },
        // Accent — warm coral, used sparingly for one pop per screen
        coral: {
          50: "#fff2ee",
          100: "#ffe1d8",
          200: "#ffc3b2",
          300: "#ff9d82",
          400: "#ff8b70",
          500: "#ff6b4a",
          600: "#f0512e",
          700: "#c8401f",
        },
        // Success — mint (status only)
        mint: {
          50: "#e6fcf5",
          100: "#c3fae8",
          200: "#96f2d7",
          300: "#63e6be",
          400: "#38d9a9",
          500: "#12b886",
          600: "#0ca678",
          700: "#099268",
        },
        // Legacy teal alias kept for backward compatibility
        accent: {
          50: "#e6fcf5",
          100: "#c3fae8",
          200: "#96f2d7",
          300: "#63e6be",
          400: "#38d9a9",
          500: "#20c997",
          600: "#12b886",
          700: "#0ca678",
          800: "#099268",
          900: "#087f5b",
        },
        // Theme-aware neutrals — driven by CSS vars (see globals.css) so
        // light/dark flip cleanly while keeping Tailwind opacity modifiers.
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-soft": "rgb(var(--line-soft) / <alpha-value>)",
        dark: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#9ca3af",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
          950: "#0a0a0f",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(92, 124, 250, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(92, 124, 250, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
