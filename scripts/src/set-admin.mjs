import { createInterface } from "node:readline";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const envPath = path.join(root, ".env");

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function updateEnvValue(key, value) {
  let content = await readFile(envPath, "utf8");
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    content = `${content.trimEnd()}\n${line}\n`;
  }

  await writeFile(envPath, content);
}

async function runResetAdmin() {
  const resetScript = path.join(root, "scripts", "src", "reset-admin.mjs");
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--env-file", envPath, resetScript],
      { cwd: root, stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`reset-admin exited with code ${code ?? 1}`));
    });
  });
}

async function main() {
  let username = process.argv[2]?.trim();
  let password = process.argv[3];

  if (!username) {
    username = await prompt("New admin username: ");
  }
  if (!password) {
    password = await prompt("New admin password: ");
  }

  if (!username || !password) {
    console.error("Username and password are required.");
    process.exit(1);
  }

  await updateEnvValue("ADMIN_USERNAME", username);
  await updateEnvValue("ADMIN_PASSWORD", password);
  console.log(`Updated .env with username "${username}".`);
  await runResetAdmin();
  console.log("Done. Sign in at http://localhost:23744/admin/");
}

main().catch((err) => {
  console.error("set-admin failed:", err);
  process.exit(1);
});
