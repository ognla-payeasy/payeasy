// @vitest-environment node
import { PATCH } from "@/app/api/user/profile/route";
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/users", () => ({
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
  updateUserProfile: vi.fn(),
  toPublicUser: (u: any) => ({ id: u.id, email: u.email, name: u.name }),
}));

vi.mock("@/lib/auth/jwt", () => ({
  verifyToken: vi.fn(),
  signToken: vi.fn(),
}));

import { findUserById, findUserByEmail, updateUserProfile } from "@/lib/auth/users";
import { verifyToken, signToken } from "@/lib/auth/jwt";

describe("PATCH /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if auth token is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name", email: "new@example.com" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 401 if auth token is invalid", async () => {
    (verifyToken as Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      headers: {
        Cookie: "auth_token=invalid-token",
      },
      body: JSON.stringify({ name: "New Name", email: "new@example.com" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if name is too short", async () => {
    (verifyToken as Mock).mockResolvedValue({ userId: "user-123" });

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      headers: {
        Cookie: "auth_token=valid-token",
      },
      body: JSON.stringify({ name: "a", email: "new@example.com" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Name must be at least 2 characters");
  });

  it("should return 400 if email is invalid", async () => {
    (verifyToken as Mock).mockResolvedValue({ userId: "user-123" });

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      headers: {
        Cookie: "auth_token=valid-token",
      },
      body: JSON.stringify({ name: "New Name", email: "invalid-email" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid email address");
  });

  it("should return 409 if email is already in use by another user", async () => {
    (verifyToken as Mock).mockResolvedValue({ userId: "user-123" });
    (findUserById as Mock).mockReturnValue({ id: "user-123", email: "old@example.com", name: "Old Name" });
    (findUserByEmail as Mock).mockReturnValue({ id: "user-456", email: "conflict@example.com", name: "Other User" });

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      headers: {
        Cookie: "auth_token=valid-token",
      },
      body: JSON.stringify({ name: "New Name", email: "conflict@example.com" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("Email is already in use");
  });

  it("should successfully update profile and return updated public user data with cookie", async () => {
    (verifyToken as Mock).mockResolvedValue({ userId: "user-123" });
    (findUserById as Mock).mockReturnValue({ id: "user-123", email: "old@example.com", name: "Old Name" });
    (findUserByEmail as Mock).mockReturnValue(null);
    (updateUserProfile as Mock).mockReturnValue({ id: "user-123", email: "new@example.com", name: "New Name" });
    (signToken as Mock).mockResolvedValue("new-jwt-token");

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      headers: {
        Cookie: "auth_token=valid-token",
      },
      body: JSON.stringify({ name: "New Name", email: "new@example.com" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.user).toEqual({ id: "user-123", email: "new@example.com", name: "New Name" });
    expect(updateUserProfile).toHaveBeenCalledWith("user-123", "New Name", "new@example.com");
    
    // Check that cookie was set in the response headers
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("auth_token=new-jwt-token");
  });
});
