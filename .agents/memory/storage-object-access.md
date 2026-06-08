---
name: Storage object access tiers
description: Two object-storage prefixes with different access control on the Grace site; which to use for new uploads.
---

# Storage object access tiers

Uploaded objects live under the private bucket but are served through `GET /api/storage/objects/*`, which is **public by default**. Access is split by path prefix:

- `uploads/` — **public**, served with no auth (resources/past papers, gallery images). Presigned via `getObjectEntityUploadURL()`.
- `applications/` — **staff-only**, gated in the objects route by `req.session.userId` (contains applicant PII from "Submit Your Completed Form"). Presigned via `getApplicationUploadURL()`.

**Why:** completed application forms are personal data and must not be world-readable, but resources/gallery must stay public. Same serving route, different prefix → different access.

**How to apply:**
- New PUBLIC downloads → use the `uploads/` flow.
- New PII/sensitive uploads → add (or reuse) an auth-gated prefix and a `signObjectURL`-based helper; gate it in `GET /storage/objects/*`.
- Public upload endpoints (no auth) must validate content-type allowlist + size cap and rate-limit per IP. Note: presigned PUT does NOT enforce these at the storage layer — the metadata check only constrains the client, so treat such files as untrusted.
- When a route accepts a client-supplied object path (e.g. submission `fileUrl`), validate it against the expected prefix/UUID pattern before storing.
