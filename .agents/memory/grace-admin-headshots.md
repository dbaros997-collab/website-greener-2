---
name: Grace leadership portrait prep
description: Durable gotchas when preparing supplied leadership portrait photos for the Grace site's light "Our Leadership" cards.
---

- Supplied leadership portrait PNGs are RGBA-but-fully-opaque (`identify` reports `alpha=False`) — the "transparent" background is actually a solid dark fill, so a naive cutout has no real alpha to work with.
- **Don't background-remove a dark-hair subject onto a light card.** The matte against a dark backdrop yields a jagged hairline + light interior fringe that is glaring on a light frame; eroding/feathering the alpha does not remove the interior fringe.
  - **Why / fix:** dark-on-light is high-contrast and unforgiving. Composite each subject onto one identical brand-green studio gradient instead — dark-on-dark-green is low-contrast, hides edge roughness, and is on-brand. Standardize all portraits onto the *same* gradient so the row looks consistent.
- **Export 8-bit.** ImageMagick `gradient:` composites default to 16-bit; a 16-bit PNG imported via the Vite `@assets` alias renders as a **broken image** (the card then shows the name twice — once as broken-img `alt`, once as the label). A `public/` copy still works, which masks the bug — so a public-copy test will NOT catch it.
- **Bust the cache by filename, not in-place overwrite.** Reusing the same `@assets` filename for an improved portrait keeps serving the browser-cached old image ("no change"). Save under a new versioned filename and update the import.
- **Verifying the import path:** the "Our Leadership" section sits far below the tall hero, so `app_preview` screenshots can't reach it, and a public-copy test doesn't exercise the real `@assets` import. Confirm the asset actually serves by curling the Vite fs URL (`/@fs/...`) and checking for `200 image/png`.
