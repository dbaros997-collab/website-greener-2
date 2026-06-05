---
name: drizzle push vs connect-pg-simple session table
description: Why `db run push` hangs on an interactive prompt in this repo, and the safe way to add a single new table.
---

# Drizzle push collides with the connect-pg-simple session table

`pnpm --filter @workspace/db run push` (and `push-force`) fail in this
non-interactive environment with:
`Error: Interactive prompts require a TTY terminal ... promptNamedWithSchemasConflict`.

**Why:** auth uses `connect-pg-simple`, which creates a `session` table at
runtime that is NOT in the Drizzle schema. Every push sees that table as a
"dropped" table and, when you also add a new table, drizzle-kit asks whether the
new table is a *rename* of `session`. That prompt needs a TTY, so it crashes.
`push-force` does not skip it and would happily drop the `session` table
(destroying all logins) if answered wrong.

**How to apply:** to add a single new table, do NOT rely on `push`. Create it
with explicit SQL (via the database/executeSql path) matching the Drizzle column
definitions exactly (snake_case names, same types/defaults). This is surgical
and never touches the `session` table. Keep the Drizzle schema file in sync so
types/codegen stay correct; the SQL just applies the DDL.

# Admin password is only bootstrapped when no staff user exists

`ensureAdminUser` (api-server bootstrap) inserts the admin account from
`ADMIN_USERNAME`/`ADMIN_PASSWORD` ONLY when the `staff_users` table is empty. If
the `ADMIN_PASSWORD` secret is later changed, the stored scrypt hash goes stale
and login returns 401 even though the secret "looks" set.

**How to apply:** to re-sync after a password change, delete the `staff_users`
row(s) and restart the api-server workflow — bootstrap recreates the account
from the current secret. There is no update-in-place path.
