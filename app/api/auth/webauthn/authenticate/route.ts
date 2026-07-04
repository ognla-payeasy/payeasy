import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { findUserByEmail, updateUser } from "@/lib/auth/users";
import { signToken } from "@/lib/auth/jwt";

const rpID = process.env.NODE_ENV === "production" ? "payeasy.com" : "localhost";
const expectedOrigin = process.env.NODE_ENV === "production" 
  ? "https://payeasy.com" 
  : "http://localhost:3000";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

// GET: Return authentication options
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.webAuthnCredentials?.map(cred => ({
      id: cred.id,
      transports: cred.transports as AuthenticatorTransportFuture[] | undefined,
    })) || [],
    userVerification: "preferred",
  });

  // Save the challenge in the user's record
  await updateUser(user.id, { currentChallenge: options.challenge });

  return NextResponse.json(options);
}

// POST: Verify authentication response
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, response } = body;

  if (!email || !response) {
    return NextResponse.json({ error: "Missing email or response" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.currentChallenge) {
    return NextResponse.json({ error: "No authentication challenge found" }, { status: 400 });
  }

  // Find the exact credential used
  const credential = user.webAuthnCredentials?.find(c => c.id === response.id);
  if (!credential) {
    return NextResponse.json({ error: "Credential not found" }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKeyBase64, "base64"),
        counter: credential.counter,
      },
    });

    if (verification.verified) {
      // Update the credential counter
      const updatedCredentials = user.webAuthnCredentials!.map(c => 
        c.id === credential.id ? { ...c, counter: verification.authenticationInfo.newCounter } : c
      );

      await updateUser(user.id, {
        webAuthnCredentials: updatedCredentials,
        currentChallenge: undefined, // clear challenge
      });

      // Issue JWT token
      const token = await signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const res = NextResponse.json({ verified: true });
      res.cookies.set("auth_token", token, COOKIE_OPTS);
      return res;
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("WebAuthn Authentication Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
