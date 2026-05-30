# Authentication Flow

PayEasy supports two independent authentication paths that can be active simultaneously for the same browser session: **Email / JWT** (traditional credential-based auth) and **Freighter Wallet** (Stellar public-key-based auth). This document describes each flow and explains how the two systems interact.

---

## 1. Email JWT Authentication Flow

Users register with an email and password. The server hashes the password, persists the account to `data/users.json`, and issues a signed JWT that is stored in an `HttpOnly` cookie.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextAPI as Next.js API Routes
    participant AuthLib as lib/auth/users.ts
    participant JWTLib as lib/auth/jwt.ts

    %% Registration
    User->>Browser: Fill sign-up form (name, email, password)
    Browser->>NextAPI: POST /api/auth/signup
    NextAPI->>AuthLib: findUserByEmail(email)
    AuthLib-->>NextAPI: null (user not found)
    NextAPI->>AuthLib: createUser(name, email, hashedPassword)
    AuthLib-->>NextAPI: { userId, email, name }
    NextAPI->>JWTLib: signToken({ userId, email, name })
    JWTLib-->>NextAPI: signed JWT
    NextAPI-->>Browser: Set-Cookie: auth_token=<JWT>; HttpOnly; Secure
    Browser-->>User: Redirected to dashboard

    %% Login
    User->>Browser: Fill login form (email, password)
    Browser->>NextAPI: POST /api/auth/login
    NextAPI->>AuthLib: findUserByEmail(email)
    AuthLib-->>NextAPI: { userId, email, hashedPassword, ... }
    NextAPI->>NextAPI: bcrypt.compare(password, hashedPassword)
    NextAPI->>JWTLib: signToken({ userId, email, name })
    JWTLib-->>NextAPI: signed JWT
    NextAPI-->>Browser: Set-Cookie: auth_token=<JWT>; HttpOnly; Secure
    Browser-->>User: Redirected to dashboard

    %% Authenticated request
    Browser->>NextAPI: GET /api/auth/me (Cookie: auth_token)
    NextAPI->>JWTLib: verifyToken(token)
    JWTLib-->>NextAPI: AuthPayload | null
    alt token valid
        NextAPI-->>Browser: 200 { userId, email, name }
    else token invalid / expired
        NextAPI-->>Browser: 401 Unauthorized
        Browser-->>User: Redirect to /login
    end

    %% Token refresh
    Browser->>NextAPI: POST /api/auth/refresh (Cookie: auth_token)
    NextAPI->>JWTLib: isTokenExpiringWithin(token, 86400)
    alt token expiring within 24 h
        NextAPI->>JWTLib: signToken(payload)
        JWTLib-->>NextAPI: new JWT
        NextAPI-->>Browser: Set-Cookie: auth_token=<new JWT>
    else token still valid
        NextAPI-->>Browser: 200 (no new cookie)
    end

    %% Logout
    User->>Browser: Click "Log out"
    Browser->>NextAPI: POST /api/auth/logout
    NextAPI-->>Browser: Set-Cookie: auth_token=; Max-Age=0
    Browser-->>User: Redirect to /login
```

**Key points:**

- Passwords are hashed with `bcrypt` before storage — the plain-text password never persists.
- The JWT is signed with `AUTH_SECRET` using HS256 and expires after `JWT_EXPIRY` (default `7d`).
- All auth cookies are `HttpOnly` and `Secure`, preventing JavaScript access.
- Token refresh is proactive: the client calls `/api/auth/refresh` within 24 hours of expiry to get a new token without requiring re-login.

---

## 2. Freighter Wallet Authentication Flow

Users connect their Stellar wallet via the Freighter browser extension. No password is involved — identity is proved by the wallet's ability to sign transactions. The wallet public key is stored alongside the JWT session for contract operations.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Freighter as Freighter Extension
    participant StellarCtx as context/StellarContext
    participant WalletLib as lib/stellar/wallet.ts

    %% First connection
    User->>Browser: Click "Connect Wallet"
    Browser->>WalletLib: isFreighterInstalled()
    WalletLib->>Freighter: isConnected()
    Freighter-->>WalletLib: { isConnected: true }
    WalletLib-->>Browser: true

    Browser->>WalletLib: connectFreighter()
    WalletLib->>Freighter: isAllowed()
    alt not yet allowed
        Freighter-->>WalletLib: { isAllowed: false }
        WalletLib->>Freighter: setAllowed()
        Freighter-->>User: Permission popup
        User->>Freighter: Click "Allow"
        Freighter-->>WalletLib: { isAllowed: true }
    end

    WalletLib->>Freighter: requestAccess()
    Freighter-->>WalletLib: { address: "G..." }
    WalletLib-->>StellarCtx: publicKey = "G..."
    StellarCtx-->>Browser: walletConnected = true, publicKey stored

    %% Network validation
    Browser->>WalletLib: getFreighterNetwork()
    WalletLib->>Freighter: getNetwork()
    Freighter-->>WalletLib: { network: "TESTNET" }
    WalletLib->>WalletLib: isWalletNetworkMismatch("TESTNET", appNetwork)
    alt network mismatch
        StellarCtx-->>Browser: Show AccountChangedBanner / error
    else network matches
        StellarCtx-->>Browser: Ready for contract calls
    end

    %% Signing a transaction
    User->>Browser: Initiate contribute / release action
    Browser->>WalletLib: signTx(xdr, "TESTNET")
    WalletLib->>Freighter: signTransaction(xdr, { networkPassphrase })
    Freighter-->>User: Transaction approval popup
    alt User approves
        User->>Freighter: Click "Sign"
        Freighter-->>WalletLib: { signedTxXdr: "..." }
        WalletLib-->>Browser: signedXdr
    else User rejects
        Freighter-->>WalletLib: { error: "User declined" }
        WalletLib-->>Browser: null
        Browser-->>User: Error toast: "Transaction rejected"
    end

    %% Account change detection
    Freighter-->>StellarCtx: accountChanged event (new address)
    StellarCtx-->>Browser: hasAccountChanged = true
    Browser-->>User: AccountChangedBanner visible → "Reconnect"
```

**Key points:**

- The wallet public key is held in React context (`StellarContext`) only — it is never persisted to `data/users.json` automatically.
- Network validation runs on connect and on every transaction to prevent signing on the wrong chain.
- Account-change detection triggers a banner that prompts the user to reconnect, avoiding silent identity switches.

---

## 3. Session Merging — Both Systems Together

A user can be authenticated via email **and** have a Freighter wallet connected simultaneously. The two sessions are independent but complement each other.

```mermaid
flowchart TD
    A[User visits PayEasy] --> B{Email session?}
    B -- Yes --> C[JWT verified via /api/auth/me]
    B -- No --> D[Show login / sign-up]
    C --> E{Wallet connected?}
    E -- Yes --> F[Full access:\nRead profile + Contract operations]
    E -- No --> G[Limited access:\nRead profile only\nNo contract interactions]

    D --> H[User logs in → JWT cookie set]
    H --> E

    G --> I[User clicks Connect Wallet]
    I --> J[Freighter flow → publicKey in context]
    J --> F

    F --> K{Action requires wallet?}
    K -- Yes, e.g. contribute --> L[buildContributeXdr → signTx via Freighter]
    K -- No, e.g. view dashboard --> M[Read-only data fetch via Horizon/RPC]

    F --> N{Action requires email auth?}
    N -- Yes, e.g. update profile --> O[API call with JWT cookie]
    N -- No --> M
```

**Session merging rules:**

| Capability | Email JWT only | Freighter only | Both |
|---|---|---|---|
| View dashboard | ✅ | ❌ (no profile) | ✅ |
| Update profile / password | ✅ | ❌ | ✅ |
| Create escrow contract | ❌ | ✅ | ✅ |
| Sign / submit transaction | ❌ | ✅ | ✅ |
| View contract state | ✅ (read-only RPC) | ✅ | ✅ |
| Export account data | ✅ | ❌ | ✅ |

The email session and wallet session share the same browser tab but are stored separately: the JWT lives in an `HttpOnly` cookie; the wallet public key lives in React context (`StellarContext`) and is re-requested from Freighter on page reload.