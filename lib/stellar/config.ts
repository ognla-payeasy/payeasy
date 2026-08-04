import { rpc, Asset } from "@stellar/stellar-sdk";

export type StellarNetwork = "testnet" | "mainnet";

export interface SupportedToken {
  symbol: string;
  name: string;
  assetCode: string;
  issuer: string;
}

export interface NetworkConfig {
  network: StellarNetwork;
  rpcUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;
}

export const NETWORKS: Record<StellarNetwork, NetworkConfig> = {
  testnet: {
    network: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    friendbotUrl: "https://friendbot.stellar.org",
  },
  mainnet: {
    network: "mainnet",
    rpcUrl: "https://soroban-rpc.mainnet.stellar.org:443",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  },
};

/**
 * Gets the current Stellar network from environment variables.
 * Defaults to 'testnet' if not specified.
 */
export function getCurrentNetwork(): StellarNetwork {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toLowerCase();
  if (network === "mainnet") return "mainnet";
  return "testnet";
}

/**
 * Returns the configuration for the current Stellar network.
 */
export function getNetworkConfig(): NetworkConfig {
  const network = getCurrentNetwork();
  return NETWORKS[network];
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    assetCode: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    assetCode: "EURC",
    issuer: "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO",
  },
];

export function getSupportedTokenByIssuer(
  issuer: string
): SupportedToken | undefined {
  return SUPPORTED_TOKENS.find((token) => token.issuer === issuer);
}

const CONTRACT_ID_PATTERN = /^C[A-Z2-7]{55}$/;

/**
 * Resolves a user-entered token identifier (a symbol like "XLM"/"USDC", or a
 * raw Soroban contract address) to the Stellar Asset Contract (SAC) address
 * the rent-escrow contract's `token_address` parameter requires.
 *
 * The escrow contract calls `token::Client::new(&env, &token_address)` and
 * invokes SEP-41 `transfer` on it — a classic asset's G... issuer address is
 * not itself invocable as a contract, so it must be resolved to its SAC
 * address first.
 */
export function resolveTokenContractAddress(
  input: string,
  passphrase: string = networkPassphrase
): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Token is required");
  }

  if (CONTRACT_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const upper = trimmed.toUpperCase();
  if (upper === "XLM" || upper === "NATIVE") {
    return Asset.native().contractId(passphrase);
  }

  const known = SUPPORTED_TOKENS.find(
    (token) => token.symbol.toUpperCase() === upper
  );
  if (known) {
    return new Asset(known.assetCode, known.issuer).contractId(passphrase);
  }

  throw new Error(
    `Unrecognized token "${input}". Use XLM, ${SUPPORTED_TOKENS.map((t) => t.symbol).join(", ")}, or a Soroban contract address (C...).`
  );
}

// Export a configured rpc.Server instance
const config = getNetworkConfig();
export const rpcServer = new rpc.Server(config.rpcUrl);
export const networkPassphrase = config.networkPassphrase;
