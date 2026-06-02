"use client";

import { useEffect } from "react";
import { getDocumentDirection } from "@/lib/utils/rtl";

export function LocaleDirection() {
  useEffect(() => {
    const locale = navigator.language || "en";
    const dir = getDocumentDirection(locale);
    document.documentElement.setAttribute("dir", dir);
  }, []);

  return null;
}
