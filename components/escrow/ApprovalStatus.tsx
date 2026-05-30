"use client";

import { Check, ShieldCheck, UserCheck, Users } from "lucide-react";

import {
  type ApprovalState,
  type MultiSigConfig,
  type Signer,
  accumulatedWeight,
  approvedRoommateCount,
  hasLandlordApproval,
  isReleaseApproved,
  requiredRoommateApprovals,
} from "@/lib/stellar/multisig";

interface ApprovalStatusProps {
  config: MultiSigConfig;
  approvals?: ApprovalState[];
}

function formatAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

/**
 * Read-only visualization of multi-sig release approvals.
 *
 * Surfaces three pieces of information for the escrow dashboard:
 *   - "X of Y approvals received" headline
 *   - Per-signer approved / pending indicators with role labels
 *   - Weighted progress bar against the configured threshold
 *
 * The interactive signing flow lives in `MultiSigApproval.tsx`. This component
 * is intentionally pure — it never calls a wallet or mutates state — so it can
 * safely render alongside the contract overview without competing for signer
 * focus.
 */
export default function ApprovalStatus({
  config,
  approvals = [],
}: ApprovalStatusProps) {
  const approvedAddresses = new Set(approvals.map((a) => a.signerAddress));
  const totalSigners = config.signers.length;
  const approvedCount = config.signers.filter((s) =>
    approvedAddresses.has(s.address)
  ).length;

  const landlordApproved = hasLandlordApproval(approvals, config);
  const roommateApprovals = approvedRoommateCount(approvals, config);
  const roommateRequired = requiredRoommateApprovals(config);
  const weight = accumulatedWeight(approvals, config);
  const releaseReady = isReleaseApproved(approvals, config);
  const progressPercent = Math.min((weight / config.threshold) * 100, 100);

  return (
    <section
      className="glass-card p-6 sm:p-8"
      aria-label="Multi-signature approval status"
    >
      <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Release Approvals
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              {approvedCount} of {totalSigners} approvals received
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-dark-400">
              {releaseReady
                ? "Approval threshold satisfied. Funds can be released."
                : `Landlord plus ${roommateRequired} roommate${
                    roommateRequired === 1 ? "" : "s"
                  } required before release.`}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-dark-500">
            Signature Weight
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {weight}
            <span className="text-sm text-dark-500"> / {config.threshold}</span>
          </p>
          <div
            className="mt-3 h-2 w-48 max-w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={weight}
            aria-valuemin={0}
            aria-valuemax={config.threshold}
            aria-label="Approval threshold progress"
          >
            <div
              className={`h-full rounded-full transition-all ${
                releaseReady ? "bg-accent-400" : "bg-brand-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-dark-500">
            Landlord
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-dark-100">
            {landlordApproved ? (
              <Check className="h-4 w-4 text-accent-300" aria-hidden="true" />
            ) : (
              <UserCheck className="h-4 w-4 text-dark-500" aria-hidden="true" />
            )}
            {landlordApproved ? "Approved" : "Pending"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-dark-500">
            Roommates
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-dark-100">
            <Users className="h-4 w-4 text-brand-300" aria-hidden="true" />
            {roommateApprovals} / {roommateRequired}
          </p>
        </div>
      </div>

      <ul className="space-y-3" aria-label="Signer approval list">
        {config.signers.map((signer) => (
          <SignerRow
            key={signer.address}
            signer={signer}
            approved={approvedAddresses.has(signer.address)}
          />
        ))}
      </ul>
    </section>
  );
}

interface SignerRowProps {
  signer: Signer;
  approved: boolean;
}

function SignerRow({ signer, approved }: SignerRowProps) {
  const isLandlord = signer.role === "landlord";

  return (
    <li
      className={`rounded-2xl border px-4 py-4 transition-colors ${
        approved
          ? "border-accent-400/40 bg-accent-500/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isLandlord
                ? "border-brand-400/40 bg-brand-500/15 text-brand-200"
                : "border-accent-400/30 bg-accent-500/10 text-accent-200"
            }`}
            aria-hidden="true"
          >
            {isLandlord ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold capitalize text-dark-100">
                {signer.role}
              </p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-dark-400">
                Weight {signer.weight}
              </span>
            </div>
            <p className="mt-1 truncate font-mono text-xs text-dark-500">
              {formatAddress(signer.address)}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
            approved
              ? "border-accent-400/30 bg-accent-500/10 text-accent-200"
              : "border-white/10 bg-white/5 text-dark-400"
          }`}
        >
          {approved ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Approved
            </>
          ) : (
            "Pending"
          )}
        </span>
      </div>
    </li>
  );
}
