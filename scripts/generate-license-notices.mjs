#!/usr/bin/env node
// Regenerates OPEN_SOURCE_NOTICES.md from the actual installed dependency
// tree via license-checker-rseidelsohn. Do not hand-edit the generated
// file — run `npm run license-report` instead.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const body = execSync(
  "npx license-checker-rseidelsohn --production --excludePrivatePackages --markdown",
  { cwd: rootDir, encoding: "utf8" },
);

const header = `# Open Source Notices

This project uses the following open-source packages. This file is
generated automatically from the installed dependency tree — do not edit
it by hand. Run \`npm run license-report\` to regenerate it after adding,
removing, or upgrading a dependency.

`;

const outPath = path.join(rootDir, "OPEN_SOURCE_NOTICES.md");
writeFileSync(outPath, header + body);
console.log(`Wrote ${outPath}`);
