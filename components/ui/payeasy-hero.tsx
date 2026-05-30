"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, useMotionValue, useAnimationFrame, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href?: string;
  hasDropdown?: boolean;
  onClick?: () => void;
}

interface ProgramCard {
  image: string;
  category: string;
  title: string;
  onClick?: () => void;
}

interface PayEasyHeroProps {
  logo?: React.ReactNode;
  navigation?: NavigationItem[];
  ctaButton?: {
    label: string;
    onClick: () => void;
  };
  headerActions?: React.ReactNode;
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  disclaimer?: string;
  socialProof?: {
    avatars: string[];
    text: string;
  };
  stats?: { label: string; value: string }[];
  programs?: ProgramCard[];
  className?: string;
  children?: React.ReactNode;
}

export function PayEasyHero({
  logo,
  navigation = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Stellar", href: "#stellar" },
  ],
  ctaButton,
  headerActions,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  disclaimer,
  socialProof,
  stats,
  programs = [],
  className,
  children,
}: PayEasyHeroProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Carousel State
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const x = useMotionValue(0);
  const CARD_WIDTH = 340; // 320 width + 20 gap
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalWidth = programs.length * CARD_WIDTH;

  useAnimationFrame((t, delta) => {
    if (!isPaused && !isHovered && programs.length > 0) {
      const speed = CARD_WIDTH / 4000;
      let newX = x.get() - delta * speed;
      
      if (newX <= -totalWidth) {
        newX += totalWidth;
      }
      x.set(newX);
    }
  });

  const resetPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    setIsPaused(true);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  }, []);

  const handleNext = () => {
    resetPauseTimeout();
    const currentX = x.get();
    const currentIdx = Math.floor(Math.abs(currentX) / CARD_WIDTH);
    let nextIdx = currentIdx + 1;
    let nextX = -(nextIdx * CARD_WIDTH);
    
    animate(x, nextX, { 
      type: "spring", stiffness: 200, damping: 25,
      onComplete: () => {
        if (x.get() <= -totalWidth) {
          x.set(x.get() + totalWidth);
        }
      }
    });
  };

  const handlePrev = () => {
    resetPauseTimeout();
    const currentX = x.get();
    const currentIdx = Math.ceil(Math.abs(currentX) / CARD_WIDTH);
    let prevIdx = currentIdx - 1;
    let prevX = -(prevIdx * CARD_WIDTH);
    
    if (prevX > 0) {
      const jumpX = currentX - totalWidth;
      x.set(jumpX);
      prevX = jumpX + CARD_WIDTH;
    }
    
    animate(x, prevX, { 
      type: "spring", stiffness: 200, damping: 25,
      onComplete: () => {
        if (x.get() > 0) {
          x.set(x.get() - totalWidth);
        }
      }
    });
  };

  return (
    <section
      className={cn(
        "relative w-full min-h-[100svh] flex flex-col overflow-hidden",
        className
      )}
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(92,124,250,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(32,201,151,0.08) 0%, transparent 60%), #0a0a0f",
      }}
      role="banner"
      aria-label="Hero section"
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(92,124,250,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 right-[15%] w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(32,201,151,0.10) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(116,143,252,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 flex flex-row justify-between items-center px-6 lg:px-16 py-6"
      >
        <div className="flex items-center">{logo}</div>

        <nav
          className="hidden lg:flex flex-row items-center gap-8"
          aria-label="Main navigation"
        >
          {navigation.map((item, index) => (
            <a
              key={index}
              href={item.href}
              onClick={item.onClick}
              className="flex flex-row items-center gap-1 text-[15px] font-medium text-dark-400 hover:text-white transition-colors"
            >
              {item.label}
              {item.hasDropdown && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {headerActions ?? (ctaButton && (
            <button
              onClick={ctaButton.onClick}
              className="hidden sm:inline-flex btn-primary text-sm"
            >
              {ctaButton.label}
            </button>
          ))}

          <button
            className="lg:hidden text-dark-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="relative z-20 lg:hidden glass px-6 py-4 mx-4 rounded-2xl"
        >
          {navigation.map((item, index) => (
            <a
              key={index}
              href={item.href}
              onClick={() => {
                setMobileMenuOpen(false);
                item.onClick?.();
              }}
              className="block py-3 text-[15px] font-medium text-dark-300 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
          {headerActions ? (
            <div className="mt-3 flex flex-col gap-2">{headerActions}</div>
          ) : ctaButton && (
            <button
              onClick={ctaButton.onClick}
              className="btn-primary w-full mt-3 justify-center text-sm"
            >
              {ctaButton.label}
            </button>
          )}
        </motion.div>
      )}

      {/* Main Content */}
      {children ? (
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          {children}
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center text-center max-w-4xl gap-7"
          >
            {/* Badge */}
            {disclaimer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass px-5 py-2 rounded-full"
              >
                <span className="text-[13px] font-medium text-brand-400 tracking-wide">
                  {disclaimer}
                </span>
              </motion.div>
            )}

            {/* Title */}
            <h1 className="font-display font-bold text-[clamp(36px,6vw,72px)] leading-[1.05] tracking-[-0.03em]">
              <span className="gradient-text">{title}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[clamp(16px,2vw,20px)] leading-relaxed text-dark-500 max-w-xl">
              {subtitle}
            </p>

            {/* Action Buttons */}
            {(primaryAction || secondaryAction) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                {primaryAction && (
                  <button
                    onClick={primaryAction.onClick}
                    className="btn-primary text-lg"
                  >
                    {primaryAction.label}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 10H13M13 10L10 7M13 10L10 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}

                {secondaryAction && (
                  <button
                    onClick={secondaryAction.onClick}
                    className="btn-secondary text-lg"
                  >
                    {secondaryAction.label}
                  </button>
                )}
              </motion.div>
            )}

            {/* Social Proof */}
            {socialProof && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-row items-center gap-3"
              >
                <div className="flex flex-row -space-x-2">
                  {socialProof.avatars.map((avatar, index) => (
                    <Image
                      key={index}
                      src={avatar}
                      alt={`User ${index + 1}`}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border-2 border-dark-950 object-cover"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-dark-600">
                  {socialProof.text}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Stats Bar */}
          {stats && stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-16 glass-card flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-white/5 px-4 sm:px-0"
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center py-5 sm:py-6 px-8 sm:px-12"
                >
                  <span className="gradient-text font-display font-bold text-2xl">
                    {stat.value}
                  </span>
                  <span className="text-[13px] text-dark-600 mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Program Cards Carousel */}
      {programs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 w-full overflow-hidden py-12"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none w-[150px]"
            style={{
              background: "linear-gradient(90deg, #0a0a0f 0%, rgba(10,10,15,0) 100%)",
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none w-[150px]"
            style={{
              background: "linear-gradient(270deg, #0a0a0f 0%, rgba(10,10,15,0) 100%)",
            }}
          />

          <motion.div 
            className="absolute inset-y-0 left-8 z-20 flex items-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <button
              onClick={handlePrev}
              className="w-12 h-12 flex items-center justify-center rounded-full glass hover:bg-white/10 pointer-events-auto transition-colors"
              aria-label="Previous card"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </motion.div>

          <motion.div 
            className="absolute inset-y-0 right-8 z-20 flex items-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <button
              onClick={handleNext}
              className="w-12 h-12 flex items-center justify-center rounded-full glass hover:bg-white/10 pointer-events-auto transition-colors"
              aria-label="Next card"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </motion.div>

          <motion.div
            className="flex items-center gap-5 pl-5"
            style={{ x }}
          >
            {[...programs, ...programs].map((program, index) => {
              // #549 — only the first 2 visible cards are loaded eagerly;
              // all duplicated / off-screen cards use lazy loading.
              const isEager = index < 2;
              return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.04, y: -8 }}
                transition={{ duration: 0.3 }}
                onClick={program.onClick}
                className="flex-shrink-0 cursor-pointer relative overflow-hidden w-[320px] h-[420px] rounded-[20px] border border-white/[0.06]"
                style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)" }}
              >
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  priority={isEager}
                  loading={isEager ? "eager" : "lazy"}
                  sizes="(max-width: 640px) 80vw, 320px"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, rgba(10,10,15,0) 40%, rgba(10,10,15,0.9) 100%)",
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-[0.12em]">
                    {program.category}
                  </span>
                  <h3 className="font-display text-xl font-semibold text-dark-100 leading-snug">
                    {program.title}
                  </h3>
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
