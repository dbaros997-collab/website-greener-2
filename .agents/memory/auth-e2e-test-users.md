---
name: Auth e2e tests should create their own staff user
description: Why authed end-to-end tests must not rely on ADMIN_* env credentials for the seeded admin account
---

The seeded admin account's username does NOT necessarily match the current `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars — the env values can drift after the initial seed (the live DB had a staff user whose username differed from `ADMIN_USERNAME`, so logging in with the env creds returned 401).

**Rule:** Any automated test that needs an authenticated staff session should create its own throwaway staff user directly in the DB (insert into `staff_users` with a `scrypt:<saltHex>:<hashHex>` hash, mirroring `artifacts/api-server/src/lib/auth.ts` `hashPassword`), run the flow, then delete it in a `finally`. Do not depend on the seeded account or `ADMIN_*` env.

**Why:** Relying on env creds makes the test flaky/failing whenever the env and DB drift; a self-created user is deterministic and self-cleaning.

**How to apply:** See `scripts/src/test-login-upload.ts` for the pattern (cookie-jar fetch against `https://$REPLIT_DEV_DOMAIN/api` to exercise the real `SameSite=None; Secure` cookie flow end to end).
