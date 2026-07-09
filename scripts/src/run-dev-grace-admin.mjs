import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const env = {
  ...process.env,
  PORT: "23745",
  BASE_PATH: "/dashboard/",
};

const isWin = process.platform === "win32";
const child = isWin
  ? spawn(
      "cmd.exe",
      ["/d", "/s", "/c", "pnpm --filter @workspace/grace-admin run dev"],
      { cwd: root, env, stdio: "inherit" },
    )
  : spawn("pnpm", ["--filter", "@workspace/grace-admin", "run", "dev"], {
      cwd: root,
      env,
      stdio: "inherit",
    });

child.on("exit", (code) => process.exit(code ?? 1));
