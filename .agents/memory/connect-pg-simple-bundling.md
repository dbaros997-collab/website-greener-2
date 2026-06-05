---
name: connect-pg-simple session table under esbuild
description: Why session auth silently fails in the bundled api-server and how to fix it
---

# connect-pg-simple + esbuild bundling

`connect-pg-simple`'s `createTableIfMissing: true` reads a `table.sql` file from its
own package directory at runtime. The api-server is bundled by esbuild into a single
`dist/index.mjs`, so that `.sql` file is NOT present at `dist/table.sql` — the store
throws `ENOENT ... dist/table.sql` and the `session` table is never created.

**Symptom:** login returns 200 and sets a cookie, but every later request is
"Not authenticated" and logout 500s — sessions never persist because there is no
table to write to.

**Fix:** create the `session` table yourself with a raw `pool.query(CREATE TABLE IF
NOT EXISTS "session" ...)` (sid varchar PK, sess json, expire timestamp + expire
index) and set `createTableIfMissing: false`.

**Why:** any connect-pg-simple feature that depends on reading files shipped inside
its package will break once the server is esbuild-bundled. Provision schema via SQL
the app runs itself, not via the library's file-reading helpers.
