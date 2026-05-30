import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import RefundPreview from "./RefundPreview";

describe("RefundPreview", () => {
  it("renders the refund amount in XLM from stroops", () => {
    // 25 XLM in stroops.
    render(<RefundPreview refundableStroops="250000000" />);

    expect(screen.getByText(/25 XLM/)).toBeTruthy();
    expect(screen.getByText(/your full contribution/i)).toBeTruthy();
  });

  it("preserves fractional XLM precision", () => {
    // 1.2345 XLM in stroops.
    render(<RefundPreview refundableStroops="12345000" />);

    expect(screen.getByText(/1.2345 XLM/)).toBeTruthy();
  });

  it("clarifies that gas fees will be deducted on submit", () => {
    render(<RefundPreview refundableStroops="100000000" />);

    expect(
      screen.getByText(/network fees \(paid in XLM\) will be deducted/i)
    ).toBeTruthy();
  });

  it("falls back to 0 XLM rather than crashing on invalid input", () => {
    render(<RefundPreview refundableStroops="not-a-number" />);

    expect(screen.getByText(/0 XLM/)).toBeTruthy();
  });

  it("supports a custom label for partial refund scenarios", () => {
    render(
      <RefundPreview
        refundableStroops="500000000"
        label="50% of your contribution"
      />
    );

    expect(screen.getByText(/50 XLM/)).toBeTruthy();
    expect(screen.getByText(/50% of your contribution/i)).toBeTruthy();
  });
});
