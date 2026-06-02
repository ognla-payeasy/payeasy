"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { Archive, Share2 } from "lucide-react";

const REVEAL_THRESHOLD = 80;
const ARCHIVE_THRESHOLD = 200;
const ACTION_BUTTON_WIDTH = 72;

interface SwipeableEscrowCardProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onShare?: () => void;
  /** When false, only Share is shown (if provided). */
  canArchive?: boolean;
}

export default function SwipeableEscrowCard({
  children,
  onArchive,
  onShare,
  canArchive = true,
}: SwipeableEscrowCardProps) {
  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [0, -REVEAL_THRESHOLD], [0, 1]);
  const isDragging = useRef(false);

  function snapTo(target: number) {
    void animate(x, target, { type: "spring", stiffness: 400, damping: 35 });
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    isDragging.current = false;
    const offset = info.offset.x;

    if (offset <= -ARCHIVE_THRESHOLD && canArchive && onArchive) {
      onArchive();
      snapTo(0);
      return;
    }

    if (offset <= -REVEAL_THRESHOLD) {
      snapTo(-actionsWidth);
      return;
    }

    snapTo(0);
  }

  const showArchive = canArchive && !!onArchive;
  const showShare = !!onShare;
  const actionsWidth =
    (showArchive ? ACTION_BUTTON_WIDTH : 0) + (showShare ? ACTION_BUTTON_WIDTH : 0);

  if (!showArchive && !showShare) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl touch-pan-y">
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ opacity: actionsOpacity, width: actionsWidth }}
        aria-hidden
      >
        {showArchive && (
          <button
            type="button"
            onClick={() => {
              onArchive?.();
              snapTo(0);
            }}
            className="flex w-[72px] flex-col items-center justify-center gap-1 bg-dark-700 text-white text-[10px] font-black uppercase tracking-wider"
            aria-label="Archive escrow"
          >
            <Archive className="h-5 w-5" />
            Archive
          </button>
        )}
        {showShare && (
          <button
            type="button"
            onClick={() => {
              onShare?.();
              snapTo(0);
            }}
            className="flex w-[72px] flex-col items-center justify-center gap-1 bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider"
            aria-label="Share escrow"
          >
            <Share2 className="h-5 w-5" />
            Share
          </button>
        )}
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -actionsWidth, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        style={{ x }}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDragEnd={handleDragEnd}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
