import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import HowItWorks from "../HowItWorks";

describe("HowItWorks", () => {
  it("matches snapshot", () => {
    const { container } = render(<HowItWorks />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
