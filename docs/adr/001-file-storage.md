# ADR 001 — File Storage for User Data

## Status

Accepted

## Context

PayEasy requires persistence for user account records (email, hashed passwords, JWT refresh tokens, and Stellar public keys). At the time of the initial prototype, the team needed a solution with zero external dependencies so that any contributor could run the full stack locally with a single `npm dev` command — no database server, no cloud credentials, no Docker required.

The chosen approach stores user records in a JSON file at `data/users.json`. Reads and writes are handled by `lib/auth/users.ts`, which loads the file into memory and serialises back to disk on each mutation. A file lock prevents concurrent write races on the same process, and the file is excluded from git via `.gitignore` so credentials are never committed.

### Why not a real database from day one?

| Concern | Assessment at decision time |
|---|---|
| Contributor onboarding friction | A Postgres/SQLite dependency would require every contributor to install and configure a database before running anything. |
| Deployment complexity | Vercel (the target platform) does not have a persistent writable filesystem on serverless functions. A managed DB (PlanetScale, Neon, Supabase) would require provisioning and secrets in every environment. |
| Data volume | During early development and the testnet phase, the user base is small (< 100 accounts). JSON file I/O is fast at this scale. |
| Time-to-first-PR | Removing the database layer from scope shortened the initial bootstrapping time significantly. |

### Known limitations

- **No concurrent-write safety across multiple server processes.** If deployed with multiple replicas or edge functions, parallel writes can corrupt `data/users.json`. The in-process lock does not span processes.
- **No querying.** Finding a user requires loading the entire file and iterating. This degrades linearly with file size.
- **No transactions.** A crash mid-write can leave a partial/invalid JSON file.
- **No backup or audit trail.** The file is the single source of truth. There is no WAL or point-in-time recovery.
- **Not suitable for production.** The file must not be used on a live deployment with real user data.

## Decision

Use `data/users.json` as the sole persistence layer for user records during the prototype and testnet phases. The abstraction layer (`lib/auth/users.ts`) exposes a typed interface (`createUser`, `findUserByEmail`, `updateUser`) so that the underlying storage can be swapped without touching call sites.

## Consequences

### Positive

- Zero setup: `git clone && npm install && npm run dev` is the full onboarding path.
- No secrets or environment variables required for auth to function locally.
- The typed adapter pattern means a real DB can be dropped in by replacing one file.

### Negative

- The app cannot be safely deployed to a multi-instance environment without first migrating to a real database.
- Data loss on server restart is possible if the write buffer is not flushed (mitigated by synchronous `fs.writeFileSync`).

### Migration trigger conditions

Migrate to a real database (recommended: PostgreSQL via Prisma, already scaffolded in `prisma/`) when **any** of the following is true:

1. The deployment target runs more than one server process or replica.
2. The registered user count exceeds 500 accounts (JSON parse time becomes measurable).
3. The application moves from testnet to mainnet with real financial transactions.
4. A security audit requires encrypted-at-rest credentials (file encryption is not implemented).
5. Any feature requires relational queries (e.g. "find all escrows for user", joining users ↔ contracts).

### Scaling implications

At 100 users the file is < 50 KB and all operations complete in < 1 ms. At 10,000 users the file would be ~5 MB; a linear scan for `findUserByEmail` would require parsing the entire JSON blob on every request. Prisma + PostgreSQL (or SQLite for single-server deployments) are the natural migration targets given the existing schema in `prisma/schema.prisma`.