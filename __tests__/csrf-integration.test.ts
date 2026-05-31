import { describe, it, assert } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/auth/csrf";

describe("CSRF Route Integration Tests (Vitest)", () => {
  it("should block POST to login without X-CSRF-Token header with HTTP 403", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Cookie": `${CSRF_COOKIE_NAME}=some-token`,
      },
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 403, "Should return HTTP 403 when header is missing");

    const body = await res.json();
    assert.strictEqual(body.error, "Invalid or missing CSRF token");
  });

  it("should block POST to login with mismatching token and cookie with HTTP 403", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        [CSRF_HEADER_NAME]: "token-a",
        "Cookie": `${CSRF_COOKIE_NAME}=token-b`,
      },
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 403, "Should return HTTP 403 when tokens mismatch");

    const body = await res.json();
    assert.strictEqual(body.error, "Invalid or missing CSRF token");
  });

  it("should bypass CSRF check and fail on body parsing if empty", async () => {
    const token = "matching-secure-token";
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        [CSRF_HEADER_NAME]: token,
        "Cookie": `${CSRF_COOKIE_NAME}=${token}`,
      },
    });

    const res = await POST(req);
    assert.notStrictEqual(res.status, 403, "Should not return HTTP 403 when tokens match");
    assert.strictEqual(res.status, 400, "Should return HTTP 400 for empty body");

    const body = await res.json();
    assert.strictEqual(body.error, "Invalid request body");
  });

  it("should bypass CSRF and return 401 for incorrect credentials", async () => {
    const token = "matching-secure-token";
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
        "Cookie": `${CSRF_COOKIE_NAME}=${token}`,
      },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      }),
    });

    const res = await POST(req);
    assert.notStrictEqual(res.status, 403, "Should bypass CSRF gate");
    assert.strictEqual(res.status, 401, "Should return 401 for invalid credentials");

    const body = await res.json();
    assert.strictEqual(body.error, "Invalid email or password");
  });
});
