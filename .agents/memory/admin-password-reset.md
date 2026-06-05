---
name: Resetting the admin (staff) password
description: Why changing the ADMIN_PASSWORD secret alone does not update the existing admin login, and the correct reset procedure.
---

# Resetting the admin login password

The admin/staff account is bootstrapped on API server startup, but **only when the `staff_users` table is empty** (idempotent guard in the bootstrap step). It reads `ADMIN_USERNAME` / `ADMIN_PASSWORD` secrets and inserts one hashed row.

**Why:** because of the empty-table guard, simply updating the `ADMIN_PASSWORD` secret and restarting does NOT change an existing account — the stored scrypt hash stays stale and login returns 401.

**How to apply (to change the password, keeping the same username):**
1. Set the new `ADMIN_PASSWORD` secret (request it securely from the user).
2. Clear the existing row: `DELETE FROM staff_users;`
3. Restart the API server workflow so bootstrap recreates the account from the current secrets.
4. Confirm via the server log line `Bootstrapped initial staff admin account`.

Default username is `admin`. Login is `POST /api/auth/login` with `{username, password}`. The code-execution sandbox does NOT expose `process.env`, so you cannot auto-test the login with the secret value — rely on the fresh bootstrap log line instead.
