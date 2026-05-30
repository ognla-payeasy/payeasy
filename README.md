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
        MONGO[(MongoDB Atlas)]
        REDIS[(Redis Cache)]
    end

    UI -->|Signs transactions| FW
    UI -->|REST calls| AUTH
    UI -->|REST calls| HEALTH
    UI -->|REST calls| ESCROW_API
    FW -->|Submits signed tx| HORIZON

    AUTH --> MONGO
    ESCROW_API --> SOROBAN
    ESCROW_API --> MONGO
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
| **Database** | MongoDB Atlas |
| **Cache** | Redis (optional) |
| **Blockchain** | Stellar Network (Soroban smart contracts) |
| **Smart Contracts** | Rust / Soroban SDK |
| **Wallet** | Freighter (Stellar wallet extension) |
| **Auth** | JWT-based authentication |
| **Language** | TypeScript |
| **Testing** | Node.js built-in test runner |
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
npx tsx scripts/check-env.ts

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
| **Auth** | `JWT_SECRET`, `JWT_EXPIRES_IN` | `JWT_SECRET` required |
| **Stellar** | `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_HORIZON_URL`, `NEXT_PUBLIC_SOROBAN_RPC_URL` | All required |
| **Database** | `MONGODB_URI`, `MONGODB_DB_NAME` | `MONGODB_URI` required |
| **Redis** | `REDIS_URL`, `REDIS_TTL` | Optional |
| **Feature Flags** | `NEXT_PUBLIC_FEATURE_*` | Optional |
| **Monitoring** | `SENTRY_DSN`, `RESEND_API_KEY` | Optional |

Run the env checker at any time to validate your setup:

```bash
npx tsx scripts/check-env.ts
```

For Stellar testnet development, the default values in `.env.example` work out of the box — you only need to set `JWT_SECRET` and `MONGODB_URI`.

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run lint checks
npm run lint

# Check JS bundle size budgets
npm run size
```

Tests live alongside the source they test (e.g., `hooks/useToast.test.ts`) and in `__tests__/` for cross-cutting concerns.

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
├── contexts/               # React context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Shared utilities
│   ├── stellar/            # Stellar SDK / Horizon integration
│   ├── preferences/        # User preferences helpers
│   └── env.ts              # Environment variable validation
├── scripts/                # Developer tooling
│   └── check-env.ts        # Env variable checker
├── __tests__/              # Integration / unit tests
├── contracts/              # Soroban smart contracts (Rust)
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
