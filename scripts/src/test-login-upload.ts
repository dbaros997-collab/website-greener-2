/**
 * End-to-end regression test for the staff login -> request-upload-URL -> upload
 * flow. This guards the critical path that previously broke when the shared
 * client omitted `credentials: "include"`, causing the session cookie to be
 * dropped and `POST /api/storage/uploads/request-url` to 401.
 *
 * It runs against the live dev server through the shared proxy over HTTPS
 * (`https://$REPLIT_DEV_DOMAIN/api`) so it exercises the real
 * `SameSite=None; Secure` cookie behaviour end to end.
 *
 * The test is self-contained: it creates a throwaway staff user directly in the
 * DB (with a random username + password), runs the flow, then deletes it — so it
 * does not depend on any seeded account or the ADMIN_* env vars.
 *
 * Run: `pnpm --filter @workspace/scripts run test:login-upload`
 */

import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { db, pool, staffUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

// Mirror of api-server's hashPassword (`scrypt:<saltHex>:<hashHex>`); scripts
// cannot import from artifact packages.
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

const domain = process.env.REPLIT_DEV_DOMAIN;
if (!domain) {
  console.error("REPLIT_DEV_DOMAIN is not set — cannot reach the dev server.");
  process.exit(1);
}

const BASE = `https://${domain}/api`;

const testUsername = `test-upload-${randomBytes(6).toString("hex")}`;
const testPassword = randomBytes(18).toString("hex");

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.error(`  FAIL  ${label}`);
    if (detail !== undefined) {
      console.error(`        ${JSON.stringify(detail)}`);
    }
  }
}

// Minimal cookie jar: stores name=value pairs from Set-Cookie response headers
// and replays them on subsequent requests, mirroring browser cookie behaviour.
const cookies = new Map<string, string>();

function storeCookies(res: Response): void {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) {
      cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
}

function cookieHeader(): string {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<Response> {
  const { auth, headers, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(headers ?? {}),
      ...(auth && cookies.size > 0 ? { Cookie: cookieHeader() } : {}),
    },
  });
  storeCookies(res);
  return res;
}

const uploadBody = {
  name: "test-photo.png",
  size: 1024,
  contentType: "image/png",
};

async function run(): Promise<void> {
  console.log(`Testing against ${BASE}\n`);

  // 1. Unauthenticated request must be rejected — the exact regression we guard.
  console.log("1. Reject unauthenticated upload-url request");
  const unauth = await api("/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uploadBody),
  });
  check("returns 401 without a session", unauth.status === 401, {
    status: unauth.status,
  });

  // 2. Staff login over HTTPS sets a session cookie.
  console.log("2. Staff login");
  const login = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUsername, password: testPassword }),
  });
  check("login returns 200", login.status === 200, { status: login.status });
  check("session cookie was set", cookies.has("connect.sid"));

  // 3. Session is recognised by an authed endpoint.
  console.log("3. Verify session via /auth/me");
  const me = await api("/auth/me", { auth: true });
  check("/auth/me returns 200", me.status === 200, { status: me.status });
  if (me.status === 200) {
    const body = (await me.json()) as { username?: string };
    check(
      "/auth/me returns the staff username",
      body.username === testUsername,
      body,
    );
  }

  // 4. Authed request-url returns a valid signed URL.
  console.log("4. Request a presigned upload URL while authenticated");
  const reqUrl = await api("/storage/uploads/request-url", {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uploadBody),
  });
  check("returns 200 with a session", reqUrl.status === 200, {
    status: reqUrl.status,
  });

  let uploadURL = "";
  if (reqUrl.status === 200) {
    const body = (await reqUrl.json()) as {
      uploadURL?: string;
      objectPath?: string;
    };
    uploadURL = body.uploadURL ?? "";
    check(
      "uploadURL is a valid https URL",
      uploadURL.startsWith("https://"),
      body.uploadURL,
    );
    check(
      "objectPath points at the uploads prefix",
      (body.objectPath ?? "").startsWith("/objects/uploads/"),
      body.objectPath,
    );
  }

  // 5. The signed URL actually accepts the file (full flow).
  console.log("5. Upload a file to the signed URL");
  if (uploadURL) {
    const put = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": uploadBody.contentType },
      body: Buffer.from("fake-png-bytes-for-test"),
    });
    check("PUT to signed URL succeeds", put.ok, { status: put.status });
  } else {
    check("PUT to signed URL succeeds", false, "no uploadURL to test");
  }
}

async function main(): Promise<void> {
  // Create the throwaway staff account this test logs in as.
  await db.insert(staffUsersTable).values({
    username: testUsername,
    passwordHash: await hashPassword(testPassword),
  });

  try {
    await run();
  } finally {
    await db.delete(staffUsersTable).where(eq(staffUsersTable.username, testUsername));
    await pool.end();
  }

  console.log(
    `\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Test crashed:", err);
  process.exit(1);
});
