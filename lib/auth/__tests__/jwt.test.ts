import { test, describe } from "node:test";
import assert from "node:assert";
import { signToken, verifyToken, isTokenExpiringWithin, isTokenExpired } from "../jwt";

describe("JWT Token Tests", () => {
  test("should sign and verify a valid token", async () => {
    const payload = {
      userId: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    const token = await signToken(payload);
    assert.ok(token, "Token should be generated");

    const verified = await verifyToken(token);
    assert.ok(verified, "Token should verify successfully");
    assert.strictEqual(verified.userId, payload.userId);
    assert.strictEqual(verified.email, payload.email);
    assert.strictEqual(verified.name, payload.name);
  });

  test("should return null for invalid token", async () => {
    const result = await verifyToken("invalid.token.here");
    assert.strictEqual(result, null, "Invalid token should return null");
  });

  test("should return null for tampered token", async () => {
    const payload = {
      userId: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    let token = await signToken(payload);
    // Tamper with the token
    const parts = token.split(".");
    parts[2] = "tamperedSignature";
    token = parts.join(".");

    const result = await verifyToken(token);
    assert.strictEqual(result, null, "Tampered token should return null");
  });

  test("should identify non-expiring token", async () => {
    const payload = {
      userId: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    const token = await signToken(payload);
    const isExpiring = await isTokenExpiringWithin(token, 86400);
    assert.strictEqual(isExpiring, false, "Fresh token should not be expiring");
  });

  test("should identify expired token", async () => {
    const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjB9.some-invalid-sig";
    const isExpired = await isTokenExpired(expiredToken);
    assert.ok(isExpired, "Invalid/expired token should return true");
  });
});
