import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import ApprovalStatus from "./ApprovalStatus";
import {
  createLandlordMajorityConfig,
  mockApproval,
} from "../../lib/stellar/multisig";

function makeConfig() {
  return createLandlordMajorityConfig({
    escrowAccountId: "GESCROW",
    landlordAddress: "GLANDLORD",
    roommateAddresses: ["GROOMMATEA", "GROOMMATEB", "GROOMMATEC"],
    networkPassphrase: "Test SDF Network ; September 2015",
  });
}

describe("ApprovalStatus", () => {
  it("renders X of Y approval headline with zero approvals", () => {
    const config = makeConfig();

    render(<ApprovalStatus config={config} approvals={[]} />);

    // Landlord + 3 roommates = 4 signers total, 0 approved.
    expect(
      screen.getByText(/0 of 4 approvals received/i)
    ).toBeTruthy();
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
  });

  it("reflects partial approvals (acceptance criteria: 2 of N visualization)", () => {
    const config = makeConfig();
    const approvals = [
      mockApproval("GLANDLORD"),
      mockApproval("GROOMMATEA"),
    ];

    render(<ApprovalStatus config={config} approvals={approvals} />);

    expect(
      screen.getByText(/2 of 4 approvals received/i)
    ).toBeTruthy();
  });

  it("ignores approvals for unknown signers in the count", () => {
    const config = makeConfig();
    const approvals = [
      mockApproval("GSTRANGER"),
      mockApproval("GLANDLORD"),
    ];

    render(<ApprovalStatus config={config} approvals={approvals} />);

    // Only the landlord matches the configured signer list.
    expect(
      screen.getByText(/1 of 4 approvals received/i)
    ).toBeTruthy();
  });

  it("announces threshold-satisfied state when release is ready", () => {
    const config = makeConfig();
    const approvals = [
      mockApproval("GLANDLORD"),
      mockApproval("GROOMMATEA"),
      mockApproval("GROOMMATEB"),
    ];

    render(<ApprovalStatus config={config} approvals={approvals} />);

    expect(
      screen.getByText(/threshold satisfied/i)
    ).toBeTruthy();
  });
});
