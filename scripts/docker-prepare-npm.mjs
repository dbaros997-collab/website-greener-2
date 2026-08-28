import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NPM_WORKSPACES = [
  "lib/*",
  "scripts",
  "artifacts/api-server",
  "artifacts/grace-high-school",
  "artifacts/grace-admin",
];

function parseCatalog(yamlText) {
  const catalog = {};
  const lines = yamlText.split("\n");
  let inCatalog = false;

  for (const line of lines) {
    if (line.trim() === "catalog:") {
      inCatalog = true;
      continue;
    }
    if (!inCatalog) continue;
    if (line.trim() === "") continue;
    if (!line.startsWith("  ")) break;

    const quoted = line.match(/^  '([^']+)':\s*(.+)\s*$/);
    const plain = line.match(/^  ([^:]+):\s*(.+)\s*$/);
    const match = quoted ?? plain;
    if (!match) continue;
    catalog[match[1]] = match[2].trim();
  }

  return catalog;
}

function expandCatalogInPackageJson(pkgPath, catalog) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  for (const section of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const deps = pkg[section];
    if (!deps) continue;

    for (const [name, version] of Object.entries(deps)) {
      if (version !== "catalog:") continue;
      const resolved = catalog[name];
      if (!resolved) {
        throw new Error(`Missing catalog entry for "${name}" in ${pkgPath}`);
      }
      deps[name] = resolved;
    }
  }

  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function collectPackageJsonPaths() {
  const paths = new Set();

  for (const pattern of NPM_WORKSPACES) {
    if (pattern.endsWith("/*")) {
      const dir = path.join(root, pattern.slice(0, -2));
      if (!fs.existsSync(dir)) continue;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const pkgPath = path.join(dir, entry.name, "package.json");
        if (fs.existsSync(pkgPath)) paths.add(pkgPath);
      }
      continue;
    }

    const pkgPath = path.join(root, pattern, "package.json");
    if (fs.existsSync(pkgPath)) paths.add(pkgPath);
  }

  paths.add(path.join(root, "package.json"));
  return [...paths];
}

const catalog = parseCatalog(
  fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf8"),
);

const rootPkgPath = path.join(root, "package.json");

for (const pkgPath of collectPackageJsonPaths()) {
  if (pkgPath === rootPkgPath) continue;
  expandCatalogInPackageJson(pkgPath, catalog);
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
delete rootPkg.preinstall;
delete rootPkg.packageManager;
rootPkg.workspaces = NPM_WORKSPACES;
fs.writeFileSync(rootPkgPath, `${JSON.stringify(rootPkg, null, 2)}\n`);

console.log("[docker-prepare-npm] npm workspaces ready; catalog: entries expanded");
