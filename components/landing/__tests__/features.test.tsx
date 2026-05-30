import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Features from "../Features";

describe("Features", () => {
  it("matches snapshot", () => {
    const { container } = render(<Features />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
