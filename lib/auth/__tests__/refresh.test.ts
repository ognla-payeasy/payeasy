import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Tests need a signing secret before the module under test is exercised.
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "payeasy-test-secret-not-for-production";
import { signToken, isTokenExpiringWithin } from "../jwt.ts";

describe("Token Refresh Scenario Tests", () => {
  test("should identify token expiring within 24 hours", async () => {
    const payload = {
      userId: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    const token = await signToken(payload);

    // Fresh token should NOT be marked as expiring within 24 hours
    // (it expires in 7 days, which is > 24 hours)
    const isExpiring = await isTokenExpiringWithin(token, 86400);
    assert.strictEqual(
      isExpiring,
      false,
      "Fresh 7-day token should not expire within 24 hours"
    );
  });

  test("should handle token refresh workflow", async () => {
    const payload = {
      userId: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    // Initial token
    const token1 = await signToken(payload);
    assert.ok(token1);

    // JWT iat has one-second granularity; wait so the refreshed token
    // gets a later issued-at and therefore differs from the first.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Simulate refresh by signing new token
    const token2 = await signToken(payload);
    assert.ok(token2);

    // Tokens should be different (different iat time)
    assert.notStrictEqual(token1, token2, "Refreshed token should be different");
  });
});
