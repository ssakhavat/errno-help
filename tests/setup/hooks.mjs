// Module hooks that let `node --test` load the app's source directly:
// resolves the "@/..." path alias (tsconfig "paths") to the repo root, adds
// the ".ts" extension that bundler-style imports omit, and loads JSON
// imports that have no `with { type: "json" }` attribute.
import { readFile } from "node:fs/promises";

const ROOT = new URL("../../", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const path = specifier.slice(2);
    const withExt = /\.(json|ts|tsx|mjs|js)$/.test(path) ? path : `${path}.ts`;
    return { url: new URL(withExt, ROOT).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    const source = await readFile(new URL(url), "utf8");
    return { format: "module", source: `export default ${source};`, shortCircuit: true };
  }
  if (url.startsWith(ROOT.href) && url.endsWith(".ts")) {
    // The package has no "type" field; say up front that these are ES
    // modules instead of letting Node guess (and warn) for every file.
    return nextLoad(url, { ...context, format: "module-typescript" });
  }
  return nextLoad(url, context);
}
