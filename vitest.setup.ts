import { vi } from "vitest";

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  thresholds = [];
}

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  // @ts-ignore -- assigning a jsdom-compatible shim
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

if (typeof globalThis.ResizeObserver === "undefined") {
  // @ts-ignore -- assigning a jsdom-compatible shim
  globalThis.ResizeObserver = MockResizeObserver;
}

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
