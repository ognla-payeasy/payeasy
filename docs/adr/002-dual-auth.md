# ADR 002 — Dual Authentication System (Email JWT + Stellar Wallet)

## Status

Accepted

## Context

PayEasy authenticates users through **two independent mechanisms that coexist by design**:

1. **Email + password (JWT).** Implemented under `lib/auth/` and `context/EmailAuthContext`. Users register with an email and password; the server issues a short-lived access JWT and a refresh token. This identity is what owns account-level data (profile, saved listings, notification preferences).
2. **Stellar wallet (Freighter).** Implemented under `lib/stellar/` and `context/StellarContext`. The wallet public key is the on-chain identity that signs escrow transactions (contribute, release, refund). Funds and contracts are bound to this key, not to the email account.

A contributor seeing two auth contexts, two providers in `app/layout.tsx`, and two sets of login UI could reasonably conclude one is redundant and try to consolidate them. **They are not redundant** — they authenticate fundamentally different things, and removing either breaks a core flow.

### Why both must coexist

| Concern | Email JWT | Stellar wallet |
|---|---|---|
| What it identifies | The person / account holder | The on-chain signer that owns funds |
| Source of truth | `data/users.json` (see [ADR 001](./001-file-storage.md)) | The Stellar network / Freighter extension |
| Used for | Profile, listings, notifications, server-side authorization | Signing escrow transactions, on-chain ownership |
| Recoverable by the team | Yes (password reset) | No — the key is custodied by the user's wallet |
| Works without the other | Browsing, account management | Signing a transaction the user already constructed |

Key reasons they cannot be merged:

- **Custody boundary.** The server never holds private keys. Escrow actions *must* be signed client-side by the wallet; a JWT can never authorize an on-chain transfer. Conversely, the wallet cannot prove ownership of an email account or gate server-side resources.
- **Different lifecycles.** A user can connect different wallets over time while keeping one email account, or use the same wallet across accounts. Collapsing them would force a 1:1 binding the product does not assume.
- **Progressive onboarding.** Visitors can create an account and browse with email auth before ever installing a wallet; they only need a wallet at the moment they transact. Requiring a wallet up front would raise onboarding friction (cf. ADR 001's onboarding rationale).
- **Authorization scope.** Server routes (e.g. notifications, profile) authorize via the JWT. On-chain authorization is enforced by the contract against the signer. These are enforced in different layers and cannot substitute for one another.

## Decision

Keep **both** authentication systems. They are complementary, not duplicative:

- Email JWT is the **account identity** (who you are to the app).
- Stellar wallet is the **financial identity** (who you are to the chain).

Code in `context/EmailAuthContext` and `context/StellarContext` must both remain mounted in `app/layout.tsx`. UI that connects a wallet must not be assumed to replace email login, and vice versa.

## Migration path (if one is ever removed)

This section exists so a future change is done deliberately, not accidentally.

**If email JWT is removed (wallet-only auth):**
- Replace server-side authorization with wallet-signature challenges (SEP-10 style: server issues a challenge, client signs with the wallet, server verifies and issues a session). 
- Migrate account-scoped data (`data/users.json`) to be keyed by public key instead of email.
- Provide an account-recovery story, since wallet keys are not server-recoverable.
- Remove `EmailAuthProvider` from `app/layout.tsx` and `lib/auth/` only after the above are in place.

**If the Stellar wallet is removed (custodial / email-only):**
- The server would need to custody keys or delegate signing — a major security and regulatory change that contradicts the current non-custodial design. This is **not** a recommended direction and would require its own ADR.
- All `lib/stellar/actions/*` signing flows would need a server-side signer; escrow ownership semantics would change.

In both cases, removal is a multi-step migration with data and security implications — never a simple deletion of "the redundant one."

## Consequences

- Two providers and two login surfaces are intentional and must be preserved.
- New features should be explicit about which identity they depend on (account data → JWT; on-chain action → wallet).
- This ADR should be cited in PR reviews that propose removing or merging an auth system.
