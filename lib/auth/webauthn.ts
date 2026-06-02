import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * Initiates the WebAuthn registration process for the current user.
 * It fetches the registration options from the server,
 * prompts the user's authenticator (e.g. Face ID, Touch ID),
 * and sends the response back to the server to verify and store.
 */
export async function registerWebAuthn(): Promise<boolean> {
  try {
    // 1. Get registration options from server
    const resp = await fetch('/api/auth/webauthn/register');
    if (!resp.ok) {
      throw new Error('Failed to get registration options');
    }
    const options = await resp.json();

    // 2. Start registration in browser
    let attResp;
    try {
      attResp = await startRegistration({ optionsJSON: options });
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        throw new Error('Authenticator is already registered.');
      }
      throw error;
    }

    // 3. Send response to server for verification
    const verificationResp = await fetch('/api/auth/webauthn/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attResp),
    });

    const verificationJSON = await verificationResp.json();
    if (verificationJSON && verificationJSON.verified) {
      return true;
    } else {
      throw new Error(verificationJSON.error || 'Verification failed');
    }
  } catch (err: any) {
    console.error('WebAuthn Registration Error:', err);
    throw err;
  }
}

/**
 * Initiates the WebAuthn authentication process.
 * Used for logging in returning users with biometric credentials.
 */
export async function authenticateWebAuthn(email: string): Promise<boolean> {
  try {
    // 1. Get authentication options from server
    const resp = await fetch(`/api/auth/webauthn/authenticate?email=${encodeURIComponent(email)}`);
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to get authentication options');
    }
    const options = await resp.json();

    // 2. Start authentication in browser
    let asseResp;
    try {
      asseResp = await startAuthentication({ optionsJSON: options });
    } catch (error: any) {
      throw error;
    }

    // 3. Send response to server for verification
    const verificationResp = await fetch('/api/auth/webauthn/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, response: asseResp }),
    });

    const verificationJSON = await verificationResp.json();
    if (verificationJSON && verificationJSON.verified) {
      return true;
    } else {
      throw new Error(verificationJSON.error || 'Authentication verification failed');
    }
  } catch (err: any) {
    console.error('WebAuthn Authentication Error:', err);
    throw err;
  }
}
