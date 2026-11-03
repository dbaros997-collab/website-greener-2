/**
 * Local installs stay on pnpm. Coolify sets ALLOW_NPM=1 so `npm ci` can run.
 * package-lock.json is kept: Docker installs from it.
 */
const ua = process.env.npm_config_user_agent || "";

if (ua.startsWith("pnpm/")) {
  process.exit(0);
}

if (process.env.ALLOW_NPM === "1" && ua.startsWith("npm/")) {
  process.exit(0);
}

console.error("Use pnpm instead");
process.exit(1);
