import freighterApi from "@stellar/freighter-api";

const {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} = freighterApi;
import { getCurrentNetwork } from "./config.ts";

/**
 * @description Checks if the Freighter browser extension is installed and available.
 * Always returns `false` in server-side rendering contexts where `window` is undefined.
 * @returns A promise resolving to `true` if Freighter is installed, `false` otherwise.
 * @throws Never — errors from the Freighter API are caught and converted to `false`.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * @description Checks if the user is currently connected to the Freighter wallet extension.
 * @returns A promise resolving to `true` if connected, `false` if disconnected or on error.
 * @throws Never — Freighter API errors are caught and converted to `false`.
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * @description Attempts to connect to the Freighter wallet extension and obtain the user's
 * public key. If the app is not yet allowed, triggers the Freighter permission popup.
 * @returns A promise resolving to the user's Stellar public key string, or `null` if the
 * user cancelled, denied access, or an error occurred.
 * @throws Never — all Freighter errors are caught and returned as `null`.
 */
export async function connectFreighter(): Promise<string | null> {
  try {
    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) {
      const setResult = await setAllowed();
      if (!setResult.isAllowed) return null;
    }

    const accessResult = await requestAccess();
    if ("error" in accessResult && accessResult.error) return null;
    return accessResult.address || null;
  } catch (error) {
    console.error("Failed to connect to Freighter:", error);
    return null;
  }
}

/**
 * @description Gets the Stellar public key of the currently connected Freighter account.
 * @returns A promise resolving to the user's Stellar public key string, or `null` if not
 * connected or an error occurred.
 * @throws Never — Freighter API errors are caught and converted to `null`.
 */
export async function getPublicKey(): Promise<string | null> {
  try {
    const result = await getAddress();
    if ("error" in result && result.error) return null;
    return result.address || null;
  } catch {
    return null;
  }
}

/**
 * @description Signs a Stellar transaction XDR string using the Freighter wallet extension.
 * @param xdr - The base64-encoded XDR of the transaction to sign.
 * @param network - Optional network override (`"TESTNET"` or `"MAINNET"`). Defaults to the
 * current app network retrieved from `getCurrentNetwork()`.
 * @returns A promise resolving to the signed transaction XDR string, or `null` if the user
 * cancelled, rejected the request, or an error occurred.
 * @throws Never — signing errors are caught and returned as `null`.
 */
export async function signTx(xdr: string, network?: string): Promise<string | null> {
  try {
    const networkToUse = network || getCurrentNetwork().toUpperCase();
    const result = await signTransaction(xdr, {
      networkPassphrase:
        networkToUse === "TESTNET"
          ? "Test SDF Network ; September 2015"
          : "Public Global Stellar Network ; September 2015",
    });

    if ("error" in result && result.error) {
      throw new Error(String(result.error));
    }

    return result.signedTxXdr;
  } catch (error) {
    console.error("Freighter signing failed:", error);
    return null;
  }
}


/**
 * @description Reads the version string of the installed Freighter extension.
 * Tries the `window.freighter.version` property, then the `getVersion()` method,
 * and finally the SDK module export as a fallback.
 * @returns A promise resolving to the version string (e.g. `"10.2.1"`), or `null` if
 * Freighter is not installed, the version cannot be determined, or the context is SSR.
 * @throws Never — all errors are caught and converted to `null`.
 */
export async function getFreighterVersion(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const win = window as Window & {
      freighter?: { version?: string; getVersion?: () => string };
    };
    if (!win.freighter) return null;

    if (typeof win.freighter.version === "string") {
      return win.freighter.version;
    }
    if (typeof win.freighter.getVersion === "function") {
      return win.freighter.getVersion() ?? null;
    }

    const freighterModule = await import("@stellar/freighter-api");
    if (typeof (freighterModule as Record<string, unknown>).getVersion === "function") {
      const result = await (freighterModule as unknown as { getVersion: () => Promise<{ version: string }> }).getVersion();
      return result?.version ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

const MINIMUM_FREIGHTER_VERSION = [10, 0, 0] as const;

function parseVersion(v: string): [number, number, number] {
  const parts = v.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * @description Checks whether the installed Freighter extension meets the minimum supported
 * version requirement (`10.0.0`).
 * @returns A promise resolving to `true` if the version is supported, `false` if it is too
 * old, or `null` if the version cannot be determined.
 * @throws Never — version detection errors result in a `null` return value.
 */
export async function isFreighterVersionSupported(): Promise<boolean | null> {
  const version = await getFreighterVersion();
  if (!version) return null;

  const [major, minor, patch] = parseVersion(version);
  const [minMajor, minMinor, minPatch] = MINIMUM_FREIGHTER_VERSION;

  if (major !== minMajor) return major > minMajor;
  if (minor !== minMinor) return minor > minMinor;
  return patch >= minPatch;
}

/**
 * @description Gets the Stellar network that Freighter is currently configured to use.
 * @returns A promise resolving to `"TESTNET"`, `"MAINNET"`, or `null` if Freighter is not
 * connected, the network is unrecognised, or an error occurred.
 * @throws Never — Freighter API errors are caught and converted to `null`.
 */
export async function getFreighterNetwork(): Promise<"TESTNET" | "MAINNET" | null> {
  if (typeof window === "undefined") return null;
  try {
    const connected = await isConnected();
    if (!connected.isConnected) return null;

    const freighterModule = await import("@stellar/freighter-api");
    if (typeof freighterModule.getNetwork === "function") {
      const networkResult = await freighterModule.getNetwork();
      return normalizeFreighterNetwork(networkResult.network);
    } else {
      return null;
    }
  } catch (error) {
    console.error("Failed to get Freighter network:", error);
    return null;
  }
}

/**
 * @description Normalises a raw network string from Freighter into a canonical app value.
 * Treats `"public"` and `"pubnet"` as aliases for `"MAINNET"`.
 * @param network - The raw network string returned by the Freighter API.
 * @returns `"TESTNET"`, `"MAINNET"`, or `null` when the value is unrecognised.
 * @throws Never — pure transformation function with no side effects.
 */
export function normalizeFreighterNetwork(
  network: string | null | undefined
): "TESTNET" | "MAINNET" | null {
  const normalized = String(network ?? "").trim().toLowerCase();

  if (normalized === "testnet") return "TESTNET";
  if (normalized === "mainnet" || normalized === "public" || normalized === "pubnet") {
    return "MAINNET";
  }

  return null;
}

/**
 * @description Determines whether the wallet's active network differs from the app's
 * configured network, indicating the user needs to switch networks in Freighter.
 * @param walletNetwork - The network currently active in Freighter (`"TESTNET"`, `"MAINNET"`, or `null`).
 * @param appNetwork - The network the application is configured for (`"testnet"` or `"mainnet"`).
 * @returns `true` if there is a mismatch, `false` if they match or `walletNetwork` is `null`.
 * @throws Never — pure comparison function with no side effects.
 */
export function isWalletNetworkMismatch(
  walletNetwork: "TESTNET" | "MAINNET" | null,
  appNetwork: "testnet" | "mainnet"
): boolean {
  if (!walletNetwork) return false;
  const app = appNetwork === "testnet" ? "TESTNET" : "MAINNET";
  return walletNetwork !== app;
}
