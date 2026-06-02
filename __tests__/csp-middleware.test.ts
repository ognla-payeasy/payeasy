import { describe, it, assert } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { CSRF_COOKIE_NAME } from "@/lib/auth/csrf";

describe("Content Security Policy Middleware Tests", () => {
  it("should inject Content-Security-Policy header into the response", () => {
    const req = new NextRequest("http://localhost/dashboard", {
      method: "GET",
    });

    const res = middleware(req);
    assert.ok(res, "Middleware must return a response");

    const csp = res.headers.get("content-security-policy");
    assert.ok(csp, "Response must contain Content-Security-Policy header");
    assert.strictEqual(csp.includes("default-src 'self'"), true, "CSP should contain default-src 'self'");
    assert.strictEqual(
      csp.includes("connect-src 'self' https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org"),
      true,
      "CSP should contain authorized connect-src URLs"
    );
    assert.strictEqual(
      csp.includes("img-src 'self' data: https://images.unsplash.com https://i.pravatar.cc"),
      true,
      "CSP should contain authorized img-src URLs"
    );
  });

  it("should generate a random base64 nonce and replace the placeholder", () => {
    const req = new NextRequest("http://localhost/dashboard", {
      method: "GET",
    });

    const res = middleware(req);
    const csp = res.headers.get("content-security-policy");
    assert.ok(csp);

    // It should not contain the literal placeholder {nonce}
    assert.strictEqual(csp.includes("{nonce}"), false, "Should not contain the raw {nonce} placeholder");

    // It should contain 'nonce-...'
    const nonceMatch = csp.match(/'nonce-([^']+)'/);
    assert.ok(nonceMatch, "CSP must contain a nonce matching 'nonce-...'");

    const nonceValue = nonceMatch[1];
    assert.ok(nonceValue, "Nonce value must not be empty");
    assert.strictEqual(nonceValue.length > 10, true, "Nonce value should have sufficient length");
  });

  it("should generate unique nonces for separate requests", () => {
    const req1 = new NextRequest("http://localhost/dashboard", { method: "GET" });
    const req2 = new NextRequest("http://localhost/dashboard", { method: "GET" });

    const res1 = middleware(req1);
    const res2 = middleware(req2);

    const csp1 = res1.headers.get("content-security-policy");
    const csp2 = res2.headers.get("content-security-policy");

    assert.ok(csp1);
    assert.ok(csp2);

    const nonce1 = csp1.match(/'nonce-([^']+)'/)?.[1];
    const nonce2 = csp2.match(/'nonce-([^']+)'/)?.[1];

    assert.ok(nonce1);
    assert.ok(nonce2);
    assert.notStrictEqual(nonce1, nonce2, "Nonces generated for separate requests must be unique");
  });

  it("should set CSRF token cookie on GET requests to /login if missing", () => {
    const req = new NextRequest("http://localhost/login", {
      method: "GET",
    });

    const res = middleware(req);
    assert.ok(res);

    // CSRF cookie should be set
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Response should set cookies");
    assert.strictEqual(setCookie.includes(CSRF_COOKIE_NAME), true, "Response should set CSRF cookie");
  });
});
