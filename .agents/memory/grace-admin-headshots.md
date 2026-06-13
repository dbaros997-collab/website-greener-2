---
name: Grace admin headshots
description: Leadership/admin portrait photos supplied for the Grace site come with solid backgrounds; how to prep them before use.
---

- Admin/leadership headshots provided for the Grace High School site arrive as `.png` files that are RGBA but fully opaque (`identify` reports `alpha=False`) — the background is solid black, not actually transparent.
- **Rule:** before placing one on a light leadership card, run the background-removal tool to produce a transparent cutout, then point the `@assets/...` import at the `*_nobg.png` version.
- **Why:** the "Our Leadership" cards sit on a light green→gold gradient frame; an opaque black-background photo renders as a harsh black box and breaks the clean look.
- **How to apply:** check with `file` / `identify`; if opaque, remove background → save alongside the original in `attached_assets/` → update the import. Use `objectFit: cover` + `objectPosition: center top` so the face stays framed.
