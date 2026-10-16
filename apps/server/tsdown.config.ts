// FILE: tsdown.config.ts
// Purpose: Builds the Synara server CLI and controls diagnostic source maps.
// Layer: Server build config
// Depends on: tsdown.

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsdown";

const sourcemapEnv = process.env.SYNARA_SERVER_SOURCEMAP?.trim().toLowerCase();
const buildSourcemap = sourcemapEnv === "1" || sourcemapEnv === "true";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migrationRuntimeSource = fs.readFileSync(
  path.join(repoRoot, "apps/server/src/persistence/Migrations.ts"),
  "utf8",
);
const migrationRuntimeSourceDigest = createHash("sha256")
  .update(migrationRuntimeSource, "utf8")
  .digest("hex");

export default defineConfig({
  entry: ["src/index.ts", "src/restoreMigrationBackup.ts", "src/runtimeDependencySmoke.ts"],
  format: ["esm"],
  outDir: "dist",
  // tsdown >=0.21 emits declarations by default; the server CLI is consumed as
  // built JS and its types come from source, so keep the output set unchanged.
  dts: false,
  // Bun builtins only resolve at runtime under Bun; MigrationBackup.ts guards
  // the import behind a `process.versions.bun` check.
  external: [/^bun:/u],
  sourcemap: buildSourcemap,
  define: {
    __SYNARA_MIGRATION_RUNTIME_SOURCE_DIGEST__: JSON.stringify(migrationRuntimeSourceDigest),
  },
  clean: true,
  noExternal: (id) => id.startsWith("@synara/"),
  // tsdown 0.21 moved the old `inlineOnly` option under `deps`; `false` keeps
  // the intentional-bundling hint off for this CLI, which inlines some deps.
  deps: { onlyBundle: false },
  banner: {
    js: "#!/usr/bin/env node\n",
  },
});
