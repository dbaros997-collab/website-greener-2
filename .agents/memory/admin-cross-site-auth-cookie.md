---
name: Admin cross-site auth session cookie
description: Why authed admin API calls can 401 even when the server flow is healthy — the shared client must send credentials.
---

- The Grace admin runs in a cross-site iframe and authenticates with a Postgres-backed session cookie set `SameSite=None; Secure`. The shared API client (`customFetch`) MUST send `credentials: "include"`. The fetch default (`same-origin`) silently drops the cookie in the partitioned/cross-site context, so authenticated calls (e.g. the gallery upload's `request-url`) intermittently 401 even though public GETs — and sometimes login — appear to work.

**Why:** the server was already configured for credentialed auth (CORS `credentials:true` reflecting `REPLIT_DOMAINS`, cookie `SameSite=None;Secure`); the client was the missing half. So a 401 on an authed admin call is usually a cookie-delivery problem, not a broken server/auth/object-storage flow.

**How to apply:**
- To prove the server side is healthy, run the full flow over HTTPS (`https://$REPLIT_DEV_DOMAIN/api/...`) with a curl cookie jar. Curl over plain `localhost:80` (HTTP) will NOT resend a `Secure` cookie, producing a false 401 — do not conclude the server is broken from that.
- `credentials: "include"` is necessary but cannot override a browser that hard-blocks third-party cookies; if uploads still fail after the fix, the admin must be opened in a first-party tab.
