#!/usr/bin/env node
/**
 * Type-checks the staged TypeScript files passed as CLI arguments.
 *
 * lint-staged invokes this as `node .husky/typecheck-staged.mjs <files...>`.
 * We can't run a plain `tsc --noEmit <files>` because that ignores the project
 * tsconfig (paths, lib, strict, etc.). Instead we generate a temporary config
 * that extends the project's tsconfig.json but only includes the staged files,
 * so the commit is validated quickly and in isolation.
 *
 * tsc is launched through the current Node binary (not the `.cmd`/`.bin`
 * shim) so this behaves identically on Windows, macOS and Linux.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import path from "node:path";

const files = process.argv.slice(2).filter((file) => /\.(ts|tsx)$/.test(file));

// Nothing to check (e.g. only non-TS files were staged).
if (files.length === 0) {
  process.exit(0);
}

const root = process.cwd();
const tmpConfigPath = path.join(
  root,
  `tsconfig.staged-${randomBytes(4).toString("hex")}.json`
);

writeFileSync(
  tmpConfigPath,
  JSON.stringify(
    {
      extends: "./tsconfig.json",
      // noEmit keeps it a pure type check; incremental is disabled so we never
      // clobber the project's tsbuildinfo cache from a throwaway config.
      compilerOptions: { noEmit: true, skipLibCheck: true, incremental: false },
      files: files.map((file) =>
        path.relative(root, path.resolve(file)).split(path.sep).join("/")
      ),
      include: [],
    },
    null,
    2
  )
);

let exitCode = 1;
try {
  const require = createRequire(import.meta.url);
  const tscBin = require.resolve("typescript/bin/tsc");
  const result = spawnSync(process.execPath, [tscBin, "-p", tmpConfigPath], {
    stdio: "inherit",
  });
  exitCode = result.status ?? 1;
} finally {
  if (existsSync(tmpConfigPath)) {
    unlinkSync(tmpConfigPath);
  }
}

process.exit(exitCode);
