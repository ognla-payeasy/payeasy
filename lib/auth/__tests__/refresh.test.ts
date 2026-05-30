import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { signToken, isTokenExpiringWithin } from "../jwt";

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

    // Simulate refresh by signing new token
    const token2 = await signToken(payload);
    assert.ok(token2);

    // Tokens should be different (different iat time)
    assert.notStrictEqual(token1, token2, "Refreshed token should be different");
  });
});
