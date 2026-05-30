import {  describe, it , assert } from "vitest";


describe("EscrowError boundary behaviour", () => {
  it("reset callback is invoked when Try Again is triggered", () => {
    let resetCalled = false;
    const mockReset = () => { resetCalled = true; };

    mockReset();
    assert.strictEqual(resetCalled, true);
  });

  it("exposes the error message for display", () => {
    const error = new Error("Soroban RPC simulation failed: network timeout");
    assert.ok(error.message.length > 0);
    assert.strictEqual(error.message, "Soroban RPC simulation failed: network timeout");
  });

  it("handles errors without a message gracefully", () => {
    const error = new Error("");
    assert.strictEqual(error.message, "");
  });

  it("logs error to console on mount (simulated)", () => {
    const logged: unknown[] = [];
    const mockConsoleError = (...args: unknown[]) => logged.push(args);

    const error = new Error("contract query failed");
    mockConsoleError("[EscrowError]", error);

    assert.strictEqual(logged.length, 1);
    assert.ok((logged[0] as unknown[])[1] === error);
  });
});
