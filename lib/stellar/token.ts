import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
  xdr,
  rpc,
} from "@stellar/stellar-sdk";
import { getCurrentNetwork, getNetworkConfig } from "./config";
import { toStellarAmount } from "./format";

/**
 * @description Thrown when a Soroban operation cannot be completed due to RPC, simulation,
 * or account-loading failures within `TokenHelper`.
 */
export class StellarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StellarError";
  }
}

/**
 * @description Interaction helper for Stellar Asset Contracts (SAC). Wraps the SAC interface
 * to provide typed `balance`, `allowance`, `approve`, and `transfer` operations.
 */
export class TokenHelper {
  private contract: Contract;

  constructor(tokenAddress: string) {
    this.contract = new Contract(tokenAddress);
  }

  /**
   * @description Fetches the SAC token balance for a given Stellar account via simulation.
   * @param accountId - The Stellar public key of the account to query.
   * @returns A promise resolving to the token balance as a `bigint`. Returns `0n` on error.
   * @throws Never — RPC errors are caught and `0n` is returned instead.
   */
  async balance(accountId: string): Promise<bigint> {
    try {
      const response = await this.invoke("balance", [
        xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(Buffer.from(accountId)))),
      ]);
      return scValToNative(response);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return BigInt(0);
    }
  }

  /**
   * @description Fetches the spending allowance granted by an owner to a spender on this SAC.
   * @param ownerId - The Stellar public key of the token owner.
   * @param spenderId - The Stellar public key of the spender whose allowance to query.
   * @returns A promise resolving to the approved spending amount as a `bigint`. Returns `0n` on error.
   * @throws Never — RPC errors are caught and `0n` is returned instead.
   */
  async allowance(ownerId: string, spenderId: string): Promise<bigint> {
    try {
      const response = await this.invoke("allowance", [
        xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(Buffer.from(ownerId)))),
        xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(Buffer.from(spenderId)))),
      ]);
      return scValToNative(response);
    } catch (error) {
      console.error("Failed to fetch allowance:", error);
      return BigInt(0);
    }
  }

  /**
   * @description Builds an `approve` contract operation for inclusion in a Stellar transaction.
   * The caller is responsible for assembling and submitting the transaction.
   * @param spenderId - The Stellar public key of the account being granted spending rights.
   * @param amount - The amount to approve; accepts `bigint`, decimal string, or number.
   * @returns A Stellar `Operation` object ready to be added to a `TransactionBuilder`.
   * @throws {StellarError} If the amount conversion or contract call construction fails.
   */
  approve(spenderId: string, amount: bigint | string | number) {
    const finalAmount = typeof amount === "bigint" ? amount : toStellarAmount(amount);
    return this.contract.call("approve", 
      xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(Buffer.from(spenderId)))),
      nativeToScVal(finalAmount, { type: "i128" })
    );
  }

  /**
   * @description Builds a `transfer` contract operation for inclusion in a Stellar transaction.
   * The caller is responsible for assembling and submitting the transaction.
   * @param toId - The Stellar public key of the recipient account.
   * @param amount - The amount to transfer; accepts `bigint`, decimal string, or number.
   * @returns A Stellar `Operation` object ready to be added to a `TransactionBuilder`.
   * @throws {StellarError} If the amount conversion or contract call construction fails.
   */
  transfer(toId: string, amount: bigint | string | number) {
    const finalAmount = typeof amount === "bigint" ? amount : toStellarAmount(amount);
    return this.contract.call("transfer",
      xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(Buffer.from(toId)))),
      nativeToScVal(finalAmount, { type: "i128" })
    );
  }

  /**
   * Invokes a read-only SAC method via Soroban RPC simulation.
   * For state-mutating calls the caller should build a full transaction;
   * this path is intentionally simulation-only (no signing required).
   */
  private async invoke(method: string, args: xdr.ScVal[]): Promise<xdr.ScVal> {
    const networkConfig = getNetworkConfig();

    let server: rpc.Server;
    try {
      server = new rpc.Server(networkConfig.rpcUrl, { allowHttp: false });
    } catch (err) {
      throw new StellarError(
        `Failed to connect to Soroban RPC at ${networkConfig.rpcUrl}: ${String(err)}`
      );
    }

    // Fetch the source account — use the contract address itself as a dummy
    // source for simulation (read-only calls don't need a real signer).
    const contractId = (
      this.contract as { contractId(): string }
    ).contractId();
    let sourceAccount;
    try {
      sourceAccount = await server.getAccount(contractId);
    } catch (err) {
      throw new StellarError(
        `Unable to load source account for simulation (${contractId}): ${String(err)}`
      );
    }

    const operation = this.contract.call(method, ...args);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkConfig.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(60)
      .build();

    let simResult: rpc.Api.SimulateTransactionResponse;
    try {
      simResult = await server.simulateTransaction(tx);
    } catch (err) {
      throw new StellarError(`Soroban RPC simulation request failed: ${String(err)}`);
    }

    if (rpc.Api.isSimulationError(simResult)) {
      throw new StellarError(`Soroban simulation error in ${method}: ${simResult.error}`);
    }

    if (!rpc.Api.isSimulationSuccess(simResult) || !simResult.result?.retval) {
      throw new StellarError(
        `Soroban simulation for ${method} returned no result`
      );
    }

    return simResult.result.retval;
  }
}
