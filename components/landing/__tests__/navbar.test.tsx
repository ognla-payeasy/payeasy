import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Navbar > ConnectWalletButton calls useRouter — supply a stub outside the App Router.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Navbar pulls in ConnectWalletButton which depends on StellarContext.
// Mock the context so the snapshot reflects a stable, disconnected state.
vi.mock("@/context/StellarContext", () => ({
  useStellar: () => ({
    publicKey: null,
    isConnected: false,
    isFreighterInstalled: false,
    isConnecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    error: null,
  }),
  useStellarAuth: () => ({
    publicKey: null,
    isConnected: false,
    isFreighterInstalled: false,
    isConnecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    error: null,
  }),
}));

vi.mock("@/context/EmailAuthContext", () => ({
  useEmailAuth: () => ({
    user: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));
import Navbar from "../Navbar";

describe("Navbar", () => {
  it("matches snapshot", () => {
    const { container } = render(<Navbar />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
