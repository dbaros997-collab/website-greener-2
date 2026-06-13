---
name: Grace admin headshots
description: Leadership/admin portrait photos supplied for the Grace site come with solid backgrounds; how to prep them before use.
---

- Admin/leadership headshots provided for the Grace High School site arrive as `.png` files that are RGBA but fully opaque (`identify` reports `alpha=False`) — the background is solid black, not actually transparent.
- **Prep step:** run the background-removal tool to get a transparent cutout, then `convert ... -trim +repage` to drop the empty margins.
- **Do NOT place a dark-hair cutout on a light card.** Background removal on dark hair against a dark/black backdrop yields a poor alpha matte: a jagged, stair-stepped hairline plus light "fringe" speckles. On a light frame this halo is glaring (the user called it "a blurry thing on top of his head"). Eroding/feathering the alpha alone does not remove the interior light fringe.
- **Reliable fix — composite onto a dark-green studio backdrop:** erode the alpha a bit (`-channel A -morphology Erode Disk:16 -blur 0x6 -level 20%,80% +channel`) to kill light fringe, build a vertical green gradient the same size (`magick -size WxH gradient:'#0C3A1D'-'#1C7340'`), then `magick bg.png eroded_person.png -composite out.png`. Dark hair on dark green blends seamlessly, dark jagged tufts disappear, and it's on-brand. Save as `*_studio.png` and point the `@assets/...` import there.
- **Why dark backdrop, not light:** dark-hair-on-light is high-contrast and unforgiving — every matte flaw shows. Dark-hair-on-dark-green is low-contrast and hides edge roughness.
- **How to apply:** check with `identify`; image ratio ~0.799 already ≈ the 4/5 card frame, so `objectFit: cover` + `objectPosition: center top` shows the whole portrait with natural green headroom. The card's own light gradient frame is hidden once the photo (with its green backdrop) fills it.
- **Verifying the card:** the "Our Leadership" section sits far below the 88vh hero, so app_preview screenshots can never reach it. To see the real card, drop a throwaway `cardtest.html` + image copy into the grace `public/` dir, screenshot `/cardtest.html`, then delete both.
