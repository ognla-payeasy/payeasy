import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Hero from "../Hero";

describe("Hero", () => {
  it("matches snapshot", () => {
    const { container } = render(<Hero />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
