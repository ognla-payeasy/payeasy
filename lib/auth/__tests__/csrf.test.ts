import { test, describe } from "node:test";
import assert from "node:assert";
import {
  generateCsrfToken,
  validateCsrf,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "../csrf.ts";

// Simple mock for NextRequest to keep unit tests 100% dependency-free and fast
class MockNextRequest {
  public headers: {
    get: (name: string) => string | null;
  };
  public cookies: {
    get: (name: string) => { value: string } | undefined;
  };

  constructor(options: { headers?: Record<string, string>; cookies?: Record<string, string> }) {
    const normalisedHeaders = Object.entries(options.headers || {}).reduce(
      (acc, [k, v]) => {
        acc[k.toLowerCase()] = v;
        return acc;
      },
      {} as Record<string, string>
    );

    this.headers = {
      get: (name: string) => normalisedHeaders[name.toLowerCase()] || null,
    };

    const cookieMap = new Map(Object.entries(options.cookies || {}));
    this.cookies = {
      get: (name: string) => {
        const val = cookieMap.get(name);
        return val !== undefined ? { value: val } : undefined;
      },
    };
  }
}

describe("CSRF Protection Unit Tests", () => {
  test("should generate a valid CSRF token", () => {
    const token = generateCsrfToken();
    assert.ok(token, "Token should be generated");
    assert.strictEqual(typeof token, "string", "Token should be a string");
    assert.strictEqual(token.length > 0, true, "Token should not be empty");
  });

  test("should validate successfully with matching cookie and header", () => {
    const token = "some-secure-random-token";
    const req = new MockNextRequest({
      headers: {
        [CSRF_HEADER_NAME]: token,
      },
      cookies: {
        [CSRF_COOKIE_NAME]: token,
      },
    });

    const isValid = validateCsrf(req as any);
    assert.strictEqual(isValid, true, "Should be valid when cookie and header match");
  });

  test("should validate successfully with case-insensitive header", () => {
    const token = "some-secure-random-token";
    const req = new MockNextRequest({
      headers: {
        "X-CSRF-Token": token,
      },
      cookies: {
        [CSRF_COOKIE_NAME]: token,
      },
    });

    const isValid = validateCsrf(req as any);
    assert.strictEqual(
      isValid,
      true,
      "Should be valid when cookie and case-insensitive header match"
    );
  });

  test("should fail validation if header is missing", () => {
    const token = "some-secure-random-token";
    const req = new MockNextRequest({
      cookies: {
        [CSRF_COOKIE_NAME]: token,
      },
    });

    const isValid = validateCsrf(req as any);
    assert.strictEqual(isValid, false, "Should fail when header is missing");
  });

  test("should fail validation if cookie is missing", () => {
    const token = "some-secure-random-token";
    const req = new MockNextRequest({
      headers: {
        "X-CSRF-Token": token,
      },
    });

    const isValid = validateCsrf(req as any);
    assert.strictEqual(isValid, false, "Should fail when cookie is missing");
  });

  test("should fail validation if cookie and header mismatch", () => {
    const req = new MockNextRequest({
      headers: {
        "X-CSRF-Token": "token-a",
      },
      cookies: {
        [CSRF_COOKIE_NAME]: "token-b",
      },
    });

    const isValid = validateCsrf(req as any);
    assert.strictEqual(
      isValid,
      false,
      "Should fail when cookie and header mismatch"
    );
  });
});
