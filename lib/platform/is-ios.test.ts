import { assert, test } from "vitest";
import { isIOSUserAgent } from "./is-ios.ts";

test("isIOSUserAgent detects iPhone", () => {
  assert.equal(
    isIOSUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
    ),
    true
  );
});

test("isIOSUserAgent detects iPadOS desktop UA", () => {
  assert.equal(
    isIOSUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      "MacIntel",
      5
    ),
    true
  );
});

test("isIOSUserAgent rejects Android", () => {
  assert.equal(
    isIOSUserAgent(
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
    ),
    false
  );
});
