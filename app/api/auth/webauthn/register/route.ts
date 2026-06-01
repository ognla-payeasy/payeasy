import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import { verifyToken } from "@/lib/auth/jwt";
import { findUserById, updateUser } from "@/lib/auth/users";

const rpName = "PayEasy";
const rpID = process.env.NODE_ENV === "production" ? "payeasy.com" : "localhost";
const expectedOrigin = process.env.NODE_ENV === "production" 
  ? "https://payeasy.com" 
  : "http://localhost:3000";

// GET: Return registration options
export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = findUserById(payload.userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: user.webAuthnCredentials?.map(cred => ({
      id: Buffer.from(cred.id, "base64url"),
      type: "public-key",
      transports: cred.transports as any[],
    })) || [],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Save the challenge in the user's record
  updateUser(user.id, { currentChallenge: options.challenge });

  return NextResponse.json(options);
}

// POST: Verify registration response
export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = findUserById(payload.userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  if (!user.currentChallenge) {
    return NextResponse.json({ error: "No registration challenge found" }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      
      const newCredential = {
        id: Buffer.from(credential.id).toString("base64url"),
        publicKeyBase64: Buffer.from(credential.publicKey).toString("base64"),
        counter: credential.counter,
        transports: body.response.transports || [],
      };

      const existingCredentials = user.webAuthnCredentials || [];
      updateUser(user.id, {
        webAuthnCredentials: [...existingCredentials, newCredential],
        currentChallenge: undefined, // clear challenge
      });

      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("WebAuthn Registration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
