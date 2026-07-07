<p align="center">
  <strong>PayEasy</strong> — Blockchain-Powered Rent Sharing for Roommates
</p>

<p align="center">
  <a href="https://github.com/Ogstevyn/payeasy/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <a href="https://github.com/Ogstevyn/payeasy/stargazers"><img src="https://img.shields.io/github/stars/Ogstevyn/payeasy?style=social" alt="Stars" /></a>
  <a href="https://stellar.org"><img src="https://img.shields.io/badge/powered%20by-Stellar-brightgreen" alt="Stellar" /></a>
  <a href="https://github.com/Ogstevyn/payeasy/actions/workflows/ci.yml"><img src="https://github.com/Ogstevyn/payeasy/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="https://github.com/Ogstevyn/payeasy/actions/workflows/bundle-size.yml"><img src="https://github.com/Ogstevyn/payeasy/actions/workflows/bundle-size.yml/badge.svg" alt="Bundle Size" /></a>
</p>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

**PayEasy** is an open-source platform that makes rent sharing trustless, transparent, and simple. It connects roommates and landlords through a blockchain-secured escrow system built on the [Stellar](https://stellar.org) network.

### The Problem

Sharing rent with roommates requires trust. Someone has to collect money. Someone has to pay the landlord. If one roommate doesn't pay, everyone suffers. There's no transparency, no accountability, and no protection.

### The Solution

PayEasy solves this with **smart contract escrow**:

1. **Find Roommates** — Browse apartments and connect with compatible people
2. **Agree on a Split** — Set each roommate's share through the Rent Builder
3. **Contribute to Escrow** — Each roommate sends their share to a Stellar smart contract
4. **Auto-Release** — When all shares are in, the full rent is released to the landlord

No middleman. No bank. Settlements in ~5 seconds. Transaction fees of ~$0.00001.

---

## Architecture

```mermaid
graph TD
    subgraph Browser
        UI[Next.js Frontend]
        FW[Freighter Wallet Extension]
    end

    subgraph "Next.js API Routes"
        AUTH[/api/auth]
        HEALTH[/api/health]
        ESCROW_API[/api/escrow]
    end

    subgraph "Stellar Network"
        HORIZON[Horizon REST API]
        SOROBAN[Soroban RPC]
        CONTRACT[Escrow Smart Contract\n Soroban/Rust]
    end

    subgraph "Data Layer"
        STORE[(File-based user store\n data/users.json)]
        REDIS[(Upstash Redis\n optional)]
    end

    UI -->|Signs transactions| FW
    UI -->|REST calls| AUTH
    UI -->|REST calls| HEALTH
    UI -->|REST calls| ESCROW_API
    FW -->|Submits signed tx| HORIZON

    AUTH --> STORE
    ESCROW_API --> SOROBAN
    HEALTH --> HORIZON

    SOROBAN --> CONTRACT
    HORIZON --> CONTRACT

    AUTH -.->|Rate limiting| REDIS
    ESCROW_API -.->|Caching| REDIS
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Persistence** | File-based user store (`data/users.json`) |
| **Cache / Rate limiting** | Upstash Redis (optional) |
| **Blockchain** | Stellar Network (Soroban smart contracts) |
| **Smart Contracts** | Rust / Soroban SDK |
| **Wallet** | Freighter (Stellar wallet extension) |
| **Auth** | JWT-based authentication |
| **Language** | TypeScript |
| **Testing** | node:test (lib/hooks) + Vitest (components/routes) |
| **CI** | GitHub Actions |

---

## Quick Start

> **Prerequisites:** Node.js v18+, npm v9+, Git, and the [Freighter Wallet](https://www.freighter.app/) browser extension.

```bash
# 1. Clone the repository
git clone https://github.com/Ogstevyn/payeasy.git
cd payeasy

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in the required values (see Environment Setup below)

# 4. Validate your environment
npm run check-env

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Environment Setup

Copy the example env file and fill in the values:

```bash
cp .env.example .env.local
```

The `.env.example` file documents every variable with inline comments, grouped by concern:

| Group | Key variables | Required? |
|---|---|---|
| **Auth** | `AUTH_SECRET`, `JWT_EXPIRY` | `AUTH_SECRET` required |
| **Stellar** | `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_HORIZON_URL`, `NEXT_PUBLIC_SOROBAN_RPC_URL` | All required |
| **Redis** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional |
| **Web Push** | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Optional |
| **Email** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Optional |
| **Monitoring** | `SENTRY_DSN`, `NEXT_PUBLIC_PLAUSIBLE_*` | Optional |

Run the env checker at any time to validate your setup:

```bash
npm run check-env
```

For Stellar testnet development, the default values in `.env.example` work out of the box — you only need to set `AUTH_SECRET`.

---

## Running Tests

```bash
# Run all tests (unit + component)
npm test

# Unit tests only — node:test over lib/ and hooks/
npm run test:unit

# Unit tests with coverage report
npm run test:unit:coverage

# Component / route tests only — Vitest (jsdom) over components/, app/, __tests__/
npm run test:components

# Run lint checks
npm run lint

# Check JS bundle size budgets
npm run size
```

Two runners split by directory: pure logic in `lib/` and `hooks/` uses the
native Node.js test runner; anything needing a DOM or the `@/` alias lives in
`components/`, `app/`, or `__tests__/` and runs under Vitest.

---

## Deployment

### Vercel (recommended)

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Set the environment variables listed in `.env.example` under **Project Settings → Environment Variables**.
3. Deploy — Vercel handles builds and preview deployments automatically.

### Self-hosted

```bash
# Build the production bundle
npm run build

# Start the production server
npm start
```

The app listens on port `3000` by default. Place it behind a reverse proxy (Nginx, Caddy) for TLS termination.

### Health Check

A health endpoint is available at `/api/health`:

```bash
curl http://localhost:3000/api/health
# { "status": "ok", "version": "1.0.0", "uptime": 42, "timestamp": "...", "checks": { "horizon": "reachable" } }
```

Returns HTTP `200` when healthy, `503` if the Stellar Horizon node is unreachable.

---

## Project Structure

```
payeasy/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles
│   └── api/                # API routes (backend)
│       └── health/         # GET /api/health
├── components/             # Shared React components
│   └── landing/            # Landing page sections
├── context/                # React context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Shared utilities
│   ├── auth/               # JWT auth, CSRF, rate limiting, user store
│   ├── stellar/            # Stellar SDK / Horizon integration
│   ├── preferences/        # User preferences helpers
│   └── env.ts              # Environment variable validation
├── scripts/                # Developer tooling
│   └── check-env.ts        # Env variable checker
├── __tests__/              # Cross-cutting Vitest tests
├── contracts/              # Soroban smart contracts (Rust)
├── docs/                   # ADRs, ops runbooks, design notes
├── .env.example            # Documented env template
├── .size-limit.json        # JS bundle size budgets
├── .github/workflows/      # CI pipelines
├── CONTRIBUTING.md         # Contributor guide
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies & scripts
```

---

## Pages

| Page | Status | Description |
|---|---|---|
| 🏠 Landing Page | ✅ Built | Hero, features, how-it-works, Stellar section |
| 🔍 Find Roommate | 🟡 Open for contribution | Browse & search apartment listings |
| 👤 Roommate Profile | 🟡 Open for contribution | View user profiles & preferences |
| 💬 Messages | 🟡 Open for contribution | Chat with potential roommates |
| 🏗️ Rent Builder | 🟡 Open for contribution | Configure rent split & roommate count |
| 📊 Escrow Dashboard | 🟡 Open for contribution | Track escrow status & contributions |
| 📜 Payment History | 🟡 Open for contribution | View past transactions on-chain |

---

## Roadmap

Planned features, not yet implemented. Tracked here so the direction is captured before the work starts.

### 🏘️ Landlord & Tenant roles + property listings — _planned_

Introduce two account types so the platform serves both sides of a rental, not just roommates splitting a bill.

**Roles**

| Role | Can do |
|---|---|
| **Landlord** | Upload and manage property listings, set rent and terms, review applicants, and create the rent-split escrow for the chosen tenants. |
| **Tenant** | Browse listings, apply/express interest, join a household, and pay their share into escrow (today's flow). |

**Landlord — upload houses**
- Create a **property listing**: address, monthly rent, number of rooms/beds, deposit, photos, description, availability date, house rules.
- Manage listings: edit, mark as available/rented, archive.
- From a listing, spin up the existing **rent-split escrow** for the accepted tenants — connecting listings to the on-chain flow already built.

**Tenant — find a home**
- Search/filter listings (location, price, rooms, move-in date).
- Apply to a listing or express interest; landlord reviews and accepts.
- Once accepted, the tenant is added to the household and pays their share via the existing protected-payment flow.

**What this touches (for whoever implements it)**
- **Data model:** add a `role` field to `User` (`LANDLORD` | `TENANT`), and a new `Property` / `Listing` model (owned by a landlord) with an optional link to an escrow agreement. Prisma schema + migration.
- **Auth/onboarding:** capture role at sign-up; role-based routing and permissions (middleware + route guards).
- **UI:** a landlord dashboard (my listings, create/edit listing, applicants) and a tenant listings browse/detail/apply experience — built in the new brand.
- **Storage:** listing photos (e.g. an object store / uploads provider) — a new concern the current app doesn't have.

> Status: **design/spec only.** No code for this exists yet.

---

## Contributing

> **Before you start, read [CONTRIBUTING.md](CONTRIBUTING.md).** It covers setup instructions, coding standards, branch naming, commit conventions, and our code of conduct.

We welcome contributions from developers of all experience levels!

1. Fork the repository and create a branch: `git checkout -b feature/your-feature`
2. Make your changes and add tests where appropriate
3. Run `npm test` and `npm run lint` to verify everything passes
4. Open a pull request against `main`

Check the [Issues](https://github.com/Ogstevyn/payeasy/issues) tab for tasks labelled `good first issue`.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Ogstevyn">Ogstevyn</a> and contributors
</p>
