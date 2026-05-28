import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { InMemoryRateLimiter } from "../rate-limit";

describe("Rate Limiting Tests", () => {
  let rateLimiter: InMemoryRateLimiter;

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter({
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });
  });

  test("should allow requests within limit", () => {
    const key = "test-ip-1";

    for (let i = 0; i < 10; i++) {
      const result = rateLimiter.check(key);
      assert.ok(result.allowed, `Request ${i + 1} should be allowed`);
      assert.strictEqual(result.remaining, 10 - i - 1);
    }
  });

  test("should block requests exceeding limit", () => {
    const key = "test-ip-2";

    // Make 10 allowed requests
    for (let i = 0; i < 10; i++) {
      const result = rateLimiter.check(key);
      assert.ok(result.allowed);
    }

    // 11th request should be blocked
    const result = rateLimiter.check(key);
    assert.strictEqual(result.allowed, false, "11th request should be blocked");
    assert.strictEqual(result.remaining, 0);
    assert.ok(result.retryAfter, "Should have retryAfter value");
  });

  test("should return correct remaining count", () => {
    const key = "test-ip-3";

    const result1 = rateLimiter.check(key);
    assert.strictEqual(result1.remaining, 9);

    const result2 = rateLimiter.check(key);
    assert.strictEqual(result2.remaining, 8);

    const result3 = rateLimiter.check(key);
    assert.strictEqual(result3.remaining, 7);
  });

  test("should isolate limits per key", () => {
    const key1 = "test-ip-4a";
    const key2 = "test-ip-4b";

    // Use all requests for key1
    for (let i = 0; i < 10; i++) {
      rateLimiter.check(key1);
    }

    // key2 should still have full quota
    const result = rateLimiter.check(key2);
    assert.ok(result.allowed, "Different key should have independent quota");
    assert.strictEqual(result.remaining, 9);
  });

  test("should reset limits for a key", () => {
    const key = "test-ip-5";

    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      rateLimiter.check(key);
    }

    let result = rateLimiter.check(key);
    assert.strictEqual(result.remaining, 4);

    // Reset
    rateLimiter.reset(key);

    // Should have full quota again
    result = rateLimiter.check(key);
    assert.ok(result.allowed);
    assert.strictEqual(result.remaining, 9);
  });

  test("should provide resetAfter timestamp", () => {
    const key = "test-ip-6";
    const result = rateLimiter.check(key);

    assert.ok(result.resetAfter > 0, "resetAfter should be positive");
    assert.ok(
      result.resetAfter <= 15 * 60 * 1000,
      "resetAfter should not exceed window"
    );
  });
});

describe("Rate Limiting - Signup (5 per hour)", () => {
  let rateLimiter: InMemoryRateLimiter;

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter({
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });
  });

  test("should allow 5 signups per hour", () => {
    const key = "signup-ip";

    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.check(key);
      assert.ok(result.allowed, `Signup ${i + 1} should be allowed`);
    }

    // 6th should be blocked
    const result = rateLimiter.check(key);
    assert.strictEqual(result.allowed, false);
  });
});

describe("Rate Limiting - Login (10 per 15 minutes)", () => {
  let rateLimiter: InMemoryRateLimiter;

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter({
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });
  });

  test("should allow 10 logins per 15 minutes", () => {
    const key = "login-ip";

    for (let i = 0; i < 10; i++) {
      const result = rateLimiter.check(key);
      assert.ok(result.allowed, `Login ${i + 1} should be allowed`);
    }

    // 11th should be blocked
    const result = rateLimiter.check(key);
    assert.strictEqual(result.allowed, false, "11th login should be blocked");
  });
});
