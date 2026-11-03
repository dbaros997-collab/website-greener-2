/**
 * Rewrite pnpm catalog: specifiers into concrete versions and declare the
 * Docker workspace set so `npm ci` can install this repo.
 *
 * Local development stays on pnpm (pnpm-workspace.yaml). This script runs
 * inside the image before `npm ci`, and again when regenerating package-lock.json.
 * It is deterministic: the same catalog always produces the same specifiers.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Packages required to build and run the Coolify image. Excludes scripts (embedded-postgres). */
const WORKSPACES = [
  "artifacts/api-server",
  "artifacts/grace-high-school",
  "artifacts/grace-admin",
  "lib/api-client-react",
  "lib/api-zod",
  "lib/db",
];

function readCatalog() {
  const yaml = readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf8");
  const catalog = {};
  let inCatalog = false;
  for (const line of yaml.split(/\r?\n/)) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (!inCatalog) continue;
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s+['"]?([^'":]+)['"]?\s*:\s*(.+?)\s*$/);
    if (!match) continue;
    catalog[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  if (Object.keys(catalog).length === 0) {
    throw new Error("No catalog entries found in pnpm-workspace.yaml");
  }
  return catalog;
}

function rewriteDeps(deps, catalog, label) {
  if (!deps) return;
  for (const [name, spec] of Object.entries(deps)) {
    if (spec === "catalog:") {
      const version = catalog[name];
      if (!version) {
        throw new Error(`No catalog version for ${name} (${label})`);
      }
      deps[name] = version;
      continue;
    }
    // npm links a workspace when the spec is "*", and does not accept pnpm's workspace: protocol.
    if (spec === "workspace:*") deps[name] = "*";
  }
}

function rewritePackage(rel, catalog, { rootManifest = false } = {}) {
  const file = path.join(root, rel, "package.json");
  const json = JSON.parse(readFileSync(file, "utf8"));
  for (const field of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    rewriteDeps(json[field], catalog, `${rel || "."} ${field}`);
  }
  if (rootManifest) {
    json.workspaces = WORKSPACES;
  }
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

const catalog = readCatalog();
rewritePackage("", catalog, { rootManifest: true });
for (const rel of WORKSPACES) rewritePackage(rel, catalog);
console.log("[npm] Materialized catalog specifiers for", WORKSPACES.length, "workspaces");
