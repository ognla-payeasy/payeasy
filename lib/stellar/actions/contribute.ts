import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  nativeToScVal,
  rpc,
} from "@stellar/stellar-sdk";
import { signTx } from "@/lib/stellar/wallet";
import { assertValidStellarAddress, assertValidContractId } from "@/lib/stellar/validation";
import { recordTransaction } from "@/lib/metrics";

const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "";
if (!rpcUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SOROBAN_RPC_URL");
}

export interface ContributeParams {
  /** Public key of the contributing roommate */
  from: string;
  /** Contribution amount (in stroops, i128) */
  amount: bigint;
  /** Deployed rent escrow contract ID */
  contractId: string;
}

export interface ContributeResult {
  success: boolean;
  txHash: string;
  ledger: number;
}

/**
 * Builds the contribute transaction XDR, including simulating for footprint.
 */
export async function buildContributeXdr(
  params: ContributeParams
): Promise<string> {
  const { from, amount, contractId } = params;
  assertValidStellarAddress(from);
  assertValidContractId(contractId);
  const server = new rpc.Server(rpcUrl);

  // Load the source account
  const sourceAccount = await server.getAccount(from);

  // Build the contract call operation using Contract.call()
  const contract = new Contract(contractId);
  const operation = contract.call(
    "contribute",
    nativeToScVal(Address.fromString(from), { type: "address" }),
    nativeToScVal(amount, { type: "i128" })
  );

  // Build the transaction
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  // Simulate to get the correct footprint and resource fees
  const simulated = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(
    transaction,
    simulated
  ).build();

  return assembledTx.toXDR();
}

/**
 * Signs the prepared XDR using Freighter and submits it to the network.
 */
export async function signAndSubmitContribute(
  xdr: string,
  from: string
): Promise<ContributeResult> {
  const server = new rpc.Server(rpcUrl);

  // Record the outcome for failure-rate metrics (issue #224). Any throw on the
  // submit/confirm path counts as a failure; a confirmed tx counts as success.
  try {
    // Sign with Freighter
    const signedXdr = await signTx(xdr, "TESTNET");
    if (!signedXdr) {
      throw new Error("Transaction signing was rejected or failed");
    }

    // Submit the signed transaction
    const signedTx = TransactionBuilder.fromXDR(
      signedXdr,
      Networks.TESTNET
    );

    const sendResult = await server.sendTransaction(signedTx);

    if (sendResult.status === "ERROR") {
      throw new Error(`Transaction submission failed: ${sendResult.status}`);
    }

    // Poll for confirmation
    const txHash = sendResult.hash;
    let getResult = await server.getTransaction(txHash);

    while (getResult.status === "NOT_FOUND") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      getResult = await server.getTransaction(txHash);
    }

    if (getResult.status === "FAILED") {
      throw new Error("Transaction failed on-chain");
    }

    recordTransaction("contribute", "success");
    return {
      success: true,
      txHash,
      ledger: getResult.latestLedger,
    };
  } catch (err) {
    recordTransaction("contribute", "failure");
    throw err;
  }
}
