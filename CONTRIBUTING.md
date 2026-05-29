# Contributing to PayEasy

Thank you for your interest in contributing to **PayEasy**! This document will help you get set up, understand our standards, and start contributing effectively.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Convention](#commit-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Available Scripts](#available-scripts)
- [Need Help?](#need-help)

---

## Code of Conduct

### Our Pledge

We are committed to providing a **friendly, safe, and welcoming** environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, ethnicity, religion, or any personal characteristic.

### Our Standards

**Do:**
- ✅ Be respectful and considerate in all interactions
- ✅ Welcome newcomers and help them learn
- ✅ Give constructive feedback on pull requests
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what is best for the project and community
- ✅ Show empathy towards other community members

**Don't:**
- ❌ Use offensive, derogatory, or discriminatory language
- ❌ Harass, troll, or personally attack other contributors
- ❌ Publish others' private information without consent
- ❌ Engage in any conduct that would be considered inappropriate in a professional setting

### Enforcement

Violations of the Code of Conduct may result in temporary or permanent bans from the project. Report issues to the maintainers via [GitHub Issues](https://github.com/Ogstevyn/payeasy/issues) or directly to [@Ogstevyn](https://github.com/Ogstevyn).

---

## Getting Started

### Prerequisites

Before contributing, make sure you have the following installed:

| Tool | Version | Installation |
|---|---|---|
| **Node.js** | v18.0.0 or higher | [nodejs.org](https://nodejs.org) |
| **npm** | v9.0.0 or higher | Comes with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |
| **VS Code** (recommended) | Latest | [code.visualstudio.com](https://code.visualstudio.com) |

#### Recommended VS Code Extensions
- ESLint
- Tailwind CSS IntelliSense
- Prettier - Code Formatter
- TypeScript Nightly

---

## Development Setup

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/payeasy.git
cd payeasy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB (required for backend features)
MONGODB_URI=your_mongodb_atlas_uri

# Auth (required for protected routes)
JWT_SECRET=your_jwt_secret

# Stellar (required for blockchain features)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

> **Note:** If you're only working on frontend/UI, you can skip the environment variables. The landing page and UI components work without them.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Set Up Upstream Remote

```bash
git remote add upstream https://github.com/Ogstevyn/payeasy.git
```

---

## Project Structure

```
payeasy/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles & design utilities
│   └── api/                    # Backend API routes
│
├── components/                 # All React components
│   └── landing/                # Landing page sections
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       ├── Stellar.tsx
│       ├── CTA.tsx
│       └── Footer.tsx
│
├── lib/                        # Shared utilities & services
│   ├── mongodb/                # MongoDB client, models, queries
│   ├── stellar/                # Stellar SDK, escrow helpers
│   └── auth/                   # JWT auth utilities
│
├── public/                     # Static assets (images, icons)
├── tailwind.config.ts          # Tailwind theme & design tokens
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies & scripts
```

### Key Directories for Contributors

- **`components/`**: This is where most frontend work happens. Each page should have its own folder (e.g., `components/find-roommate/`, `components/messages/`)
- **`app/`**: Next.js pages. Each new page gets a folder with a `page.tsx` inside (e.g., `app/find-roommate/page.tsx`)
- **`lib/`**: Shared logic. Database queries, API helpers, Stellar integration utilities
- **`app/api/`**: Backend endpoints. Each route gets a `route.ts` file

---

## How to Contribute

### 1. Find an Issue

- Browse the [issues.md](issues.md) file or the [Issues](https://github.com/Ogstevyn/payeasy/issues) tab.
- Look for issues labeled `good first issue` if you're new.
- **Strict 4-Hour Rule**: Once assigned, you have **4 hours** to submit a PR. If not, the issue will be re-assigned.
- **Automated Merging**: PRs passing all CI tests and marked with the `automerge` label by a maintainer will be automatically merged into `main`.
- Comment on the issue to let others know you're working on it.
- Wait for a maintainer to assign it to you.

### 2. Branch Protection Rules

The `main` branch has strict protection rules enabled to maintain code quality:
- **Direct Pushes**: Disallowed. All changes must be made via a Pull Request.
- **Reviews**: At least 1 approved review from a maintainer is required before merging.
- **CI Checks**: All Continuous Integration (CI) checks must pass successfully before merging.

### 3. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create your feature branch
git checkout -b feat/your-feature-name
```

### 3. Make Your Changes

- Write clean, typed code
- Follow the coding standards below
- Test your changes locally

### 4. Submit a Pull Request

- Push your branch and open a PR against `main`
- Fill out the PR template
- Link the issue you're resolving

---

## Branch Naming Convention

Use the following prefixes:

| Prefix | Use Case | Example |
|---|---|---|
| `feat/` | New feature | `feat/find-roommate-page` |
| `fix/` | Bug fix | `fix/navbar-mobile-menu` |
| `docs/` | Documentation | `docs/api-reference` |
| `style/` | Styling / UI change | `style/hero-responsive` |
| `refactor/` | Code refactor | `refactor/auth-middleware` |
| `test/` | Adding tests | `test/escrow-service` |
| `chore/` | Config / tooling | `chore/eslint-rules` |

---

## Commit Convention

We follow **Conventional Commits**:

```
type(scope): description

Examples:
feat(find-roommate): add search filters component
fix(navbar): fix mobile menu not closing on link click
docs(readme): update setup instructions
style(hero): adjust gradient colors on mobile
test(escrow): add unit tests for contribution logic
```

### Types
- `feat` — A new feature
- `fix` — A bug fix
- `docs` — Documentation changes
- `style` — CSS / styling changes (not code logic)
- `refactor` — Code change that neither fixes a bug nor adds a feature
- `test` — Adding or updating tests
- `chore` — Changes to build process, dependencies, or tooling

---

## Pull Request Guidelines

1. **One PR per issue** — Don't bundle unrelated changes
2. **Keep it small** — Smaller PRs are reviewed faster
3. **Describe your changes** — Explain what and why in the PR description
4. **Include screenshots** — For any UI changes, include before/after screenshots
5. **Test locally** — Make sure `npm run build` passes before submitting
6. **No console.logs** — Remove all debugging logs before submitting
7. **No `any` types** — Use proper TypeScript types

### PR Checklist

```markdown
- [ ] My code follows the project's coding standards
- [ ] I've tested my changes locally
- [ ] `npm run build` passes without errors
- [ ] I've included screenshots for UI changes
- [ ] I've linked the relevant issue
- [ ] I've written meaningful commit messages
```

---

## Coding Standards

### TypeScript
- **Always use TypeScript** — No `.js` or `.jsx` files
- **No `any` type** — Define proper types and interfaces
- **Use interfaces** for component props and data shapes
- **Place shared types** in `lib/types/`

### React & Next.js
- Use **functional components** only
- Use `"use client"` directive only when the component needs interactivity (state, effects, event handlers)
- Prefer **server components** by default
- Use **Next.js Image** component for images
- Use **Next.js Link** component for navigation

### Styling
- Use **Tailwind CSS** for all styling
- Use the design utilities defined in `globals.css` (`glass`, `glass-card`, `gradient-text`, `btn-primary`, `btn-secondary`)
- Follow the color palette defined in `tailwind.config.ts` (brand blues, accent greens)
- Maintain dark theme consistency — the app uses a dark background (`#0a0a0f`)
- Ensure **responsive design** — test on mobile, tablet, and desktop

### File & Component Naming
- Components: `PascalCase.tsx` (e.g., `RoommateCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Pages: `page.tsx` inside the route folder
- One component per file

### Design Tokens (from `tailwind.config.ts`)

```
Brand colors:   brand-50 through brand-900 (blue palette)
Accent colors:  accent-50 through accent-900 (teal/green palette)
Dark colors:    dark-50 through dark-950 (grayscale)

Animations:     animate-fade-in, animate-slide-up, animate-float, animate-glow
Glass effects:  glass, glass-card (CSS classes in globals.css)
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Need Help?

- 💬 Open a [Discussion](https://github.com/Ogstevyn/payeasy/discussions) for questions
- 🐛 Found a bug? Open an [Issue](https://github.com/Ogstevyn/payeasy/issues/new)
- 📧 Reach the maintainer: [@Ogstevyn](https://github.com/Ogstevyn)

---

Thank you for helping build PayEasy! Every contribution makes rent sharing fairer and more transparent. 🚀
