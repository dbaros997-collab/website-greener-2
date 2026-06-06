---
name: Grace site preview quirks
description: Operational quirks when visually verifying the grace-high-school public site via app_preview screenshots.
---

# Verifying the Grace public site visually

- The `app_preview` screenshot tool renders from the **top of the document** and does NOT honor `/#anchor` hash scroll — navigating to `/#welcome` still captures the hero.
- The public site hero (`artifacts/grace-high-school/src/App.tsx`) uses `minHeight: 88vh`, so its rendered height scales with the screenshot viewport height. A taller viewport just makes the hero taller, so sections below the stats bar keep getting pushed past the capture window (max viewport edge is 3000px).
- **How to apply:** to confirm a lower section renders, rely on `pnpm --filter @workspace/grace-high-school run typecheck` + the code review + clean browser console, rather than expecting a single screenshot to reach it. The hero tagline/buttons are still a good live-render sanity check.
