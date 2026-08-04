/**
 * Deploys a fresh instance of the rent-escrow contract for a single escrow
 * agreement.
 *
 * The rent-escrow contract's `initialize` has no re-initialization guard —
 * calling it twice on the same contract instance overwrites the prior
 * landlord/roommates/rent state. Each escrow agreement therefore needs its
 * own contract instance, deployed from the WASM code already uploaded to
 * the network (see NEXT_PUBLIC_ESCROW_WASM_HASH), rather than reusing one
 * shared contract ID across agreements.
 */

import {
  Address,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTx } from "@/lib/stellar/wallet";
import { assertValidStellarAddress } from "@/lib/stellar/validation";

/** 32 random bytes via Web Crypto (available in both browsers and Node). */
function randomSalt(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "";
if (!rpcUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SOROBAN_RPC_URL");
}

export interface DeployEscrowInstanceParams {
  /** Public key of the landlord deploying (and signing for) the new instance */
  landlord: string;
}

export interface DeployEscrowInstanceResult {
  /** Address (C...) of the newly deployed contract instance */
  contractId: string;
  txHash: string;
}

/**
 * Builds, simulates, signs, and submits a `CreateContract` invocation that
 * instantiates a new copy of the rent-escrow contract from its known WASM
 * hash, owned by `landlord`. Returns the new contract's address.
 */
export async function deployEscrowInstance(
  params: DeployEscrowInstanceParams
): Promise<DeployEscrowInstanceResult> {
  const { landlord } = params;
  assertValidStellarAddress(landlord);

  const wasmHashHex = process.env.NEXT_PUBLIC_ESCROW_WASM_HASH;
  if (!wasmHashHex) {
    throw new Error(
      "NEXT_PUBLIC_ESCROW_WASM_HASH is not configured. Set it to the SHA-256 " +
        "hash of the deployed rent-escrow contract WASM."
    );
  }

  const server = new rpc.Server(rpcUrl);
  const sourceAccount = await server.getAccount(landlord);

  const operation = Operation.createCustomContract({
    address: Address.fromString(landlord),
    wasmHash: Buffer.from(wasmHashHex, "hex"),
    salt: randomSalt(),
  });

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  const simulated = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(transaction, simulated).build();

  const signedXdr = await signTx(assembledTx.toXDR(), "TESTNET");
  if (!signedXdr) {
    throw new Error("Transaction signing was rejected or failed");
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${sendResult.status}`);
  }

  const txHash = sendResult.hash;
  let getResult = await server.getTransaction(txHash);

  while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    getResult = await server.getTransaction(txHash);
  }

  if (getResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error("Contract deployment failed on-chain");
  }

  if (!getResult.returnValue) {
    throw new Error("Deployment succeeded but returned no contract address");
  }

  const contractId = scValToNative(getResult.returnValue) as string;

  return { contractId, txHash };
}
