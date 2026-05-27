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
 * Thrown when a Soroban operation cannot be completed.
 */
export class StellarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StellarError";
  }
}

/**
 * Interaction helper for Stellar Asset Contracts (SAC)
 */
export class TokenHelper {
  private contract: Contract;

  constructor(tokenAddress: string) {
    this.contract = new Contract(tokenAddress);
  }

  /**
   * Fetches the token balance for a given account.
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
   * Fetches the spending allowance for a spender on behalf of an owner.
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
   * Creates an "approve" operation for the SAC.
   */
  approve(spenderId: string, amount: bigint | string | number) {
    const finalAmount = typeof amount === "bigint" ? amount : toStellarAmount(amount);
    return this.contract.call("approve", 
      xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(Buffer.from(spenderId)))),
      nativeToScVal(finalAmount, { type: "i128" })
    );
  }

  /**
   * Creates a "transfer" operation for the SAC.
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
    const contractId = (this.contract as any).contractId() as string;
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
