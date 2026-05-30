## Summary

This PR resolves four issues across docs, DevOps, and CI:

- **Fix #211 — README Overhaul:** Rewrote README with a Table of Contents, Mermaid architecture diagram, Quick Start, Environment Setup, Running Tests, Deployment (Vercel + self-hosted), and Contributing sections. A developer can now clone and run the project by following the README alone.

- **Fix #206 — Bundle Size Budget Check:** Added `size-limit` and `@size-limit/file` as dev dependencies. `.size-limit.json` enforces a 150 kB budget for the landing page and 200 kB for the escrow page (gzipped). `ci.yml` gains a `bundle-size` job that builds the app and fails if either budget is exceeded.

- **Fix #208 — Environment Variable Documentation:** Expanded `.env.example` to document every variable with inline comments grouped by Auth, Stellar, Database, Redis, Feature Flags, and Monitoring. Added `scripts/check-env.ts` which prints a grouped validation table and exits non-zero when required variables are missing.

- **Fix #210 — Health Check Endpoint:** Created `app/api/health/route.ts` returning `{ status, version, uptime, timestamp, checks }`. Makes a live request to Horizon with a 5-second timeout; returns HTTP 200 when healthy and HTTP 503 when Horizon is unreachable.

## Files changed

| File | Change |
|---|---|
| `README.md` | Rewritten with full onboarding content + Mermaid diagram |
| `.env.example` | Expanded with every variable, inline docs, grouped by concern |
| `scripts/check-env.ts` | New — validates required env vars with grouped output |
| `app/api/health/route.ts` | New — `GET /api/health` with Horizon reachability check |
| `.size-limit.json` | New — 150 kB / 200 kB JS budgets for landing and escrow pages |
| `package.json` | Added `size-limit`, `@size-limit/file` deps and `size` script |
| `.github/workflows/ci.yml` | Added `bundle-size` job after frontend build |
| `.gitignore` | Unblocked `scripts/check-env.ts` from ignore rule |

## Test plan

- [ ] `GET /api/health` returns `{ "status": "ok" }` with HTTP 200 on a healthy instance
- [ ] `GET /api/health` returns HTTP 503 when `NEXT_PUBLIC_HORIZON_URL` is set to an unreachable host
- [ ] `npx tsx scripts/check-env.ts` exits 0 with all required vars set, exits 1 with missing vars
- [ ] `npm run size` passes against the current build output
- [ ] README renders correctly on GitHub with the Mermaid diagram visible
- [ ] CI `bundle-size` job passes in GitHub Actions

🤖 Generated with [Claude Code](https://claude.com/claude-code)
