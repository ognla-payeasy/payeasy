import { useEffect, useRef, useState } from "react";

type ScrollDirection = "up" | "down" | "idle";

export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>("idle");
  const lastYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastYRef.current) < threshold) return;
      setDirection(currentY > lastYRef.current ? "down" : "up");
      lastYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return direction;
}
