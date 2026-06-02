/**
 * Detects iOS (iPhone, iPod, iPad including iPadOS desktop UA).
 */
export function isIOSUserAgent(userAgent: string, platform?: string, maxTouchPoints?: number): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  return platform === "MacIntel" && (maxTouchPoints ?? 0) > 1;
}

export function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIOSUserAgent(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
}
