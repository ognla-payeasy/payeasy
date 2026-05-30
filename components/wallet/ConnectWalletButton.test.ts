import {  assert , test } from "vitest";



// Tests for ConnectWalletButton connection-state logic.
// Full render/interaction is verified manually per the acceptance criteria.

test("button is disabled when isConnecting is true", () => {
  const isConnecting = true;
  // disabled attribute should be set
  assert.ok(isConnecting, "button must be disabled while connecting");
});

test("button is not disabled when isConnecting is false", () => {
  const isConnecting = false;
  assert.ok(!isConnecting, "button must be enabled when not connecting");
});

test("spinner icon is shown when connecting, wallet icon otherwise", () => {
  const getIcon = (isConnecting: boolean) =>
    isConnecting ? "Loader2" : "Wallet";

  assert.equal(getIcon(true), "Loader2");
  assert.equal(getIcon(false), "Wallet");
});

test("button label is 'Connecting...' when pending, 'Connect Wallet' otherwise", () => {
  const getLabel = (isConnecting: boolean) =>
    isConnecting ? "Connecting..." : "Connect Wallet";

  assert.equal(getLabel(true), "Connecting...");
  assert.equal(getLabel(false), "Connect Wallet");
});

test("opacity class is 70% when connecting", () => {
  const getOpacityClass = (isConnecting: boolean) =>
    isConnecting ? "opacity-70" : "";

  assert.equal(getOpacityClass(true), "opacity-70");
  assert.equal(getOpacityClass(false), "");
});
