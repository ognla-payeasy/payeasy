import {  assert , test } from "vitest";



import {
  ONBOARDING_STORAGE_KEY,
  isOnboarded,
  markOnboarded,
  type OnboardingStorage,
} from "./onboarding-card.helpers.ts";

function makeMemoryStorage(seed: Record<string, string> = {}): OnboardingStorage & {
  dump: () => Record<string, string>;
} {
  const store: Record<string, string> = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = value;
    },
    dump() {
      return { ...store };
    },
  };
}

test("isOnboarded returns false for a fresh storage (first connect)", () => {
  const storage = makeMemoryStorage();
  assert.equal(isOnboarded(storage), false);
});

test("isOnboarded returns true once markOnboarded has been called", () => {
  const storage = makeMemoryStorage();
  markOnboarded(storage);
  assert.equal(isOnboarded(storage), true);
});

test("markOnboarded writes the expected key/value into storage", () => {
  const storage = makeMemoryStorage();
  markOnboarded(storage);
  assert.equal(storage.dump()[ONBOARDING_STORAGE_KEY], "1");
});

test("isOnboarded only accepts the '1' flag value (ignores stale/unexpected values)", () => {
  const stale = makeMemoryStorage({ [ONBOARDING_STORAGE_KEY]: "true" });
  assert.equal(isOnboarded(stale), false);
});

test("isOnboarded returns false when no storage is available (SSR)", () => {
  // No storage argument and no `window` in the node test runner — SSR-safe path.
  assert.equal(isOnboarded(), false);
});
