---
name: CSS url() must quote asset URLs
description: Inline backgroundImage url(${asset}) breaks for filenames containing parentheses; always quote.
---

# CSS `url()` + asset filenames with parentheses

When building an inline style `backgroundImage: \`url(${src})\``, the `src` can be a
Vite-resolved dev URL like `/@fs/.../attached_assets/3@_(5)_1781251364787.JPG`. If the
filename contains parentheses (`(5)`), the **unquoted** CSS `url(...)` treats them as the
`url()` delimiters and the URL silently fails to load — the element just shows whatever is
behind it (e.g. a dark hero section), with no console error.

**Rule:** always quote dynamic background URLs: `backgroundImage: \`url("${src}")\``.

**Why:** many uploaded `attached_assets/` photos have filenames like `3@_(7)_...JPG`,
`3@_(5)_...JPG`. Unquoted url() works only by luck for names without parens (e.g.
`IMG_9926_...jpg`), which masks the bug until a parenthesised image is used.

**How to apply:** when adding/auditing any inline `url(${...})` in this repo (hero
slideshow `HERO_SLIDES`, footer watermark, etc.), wrap the interpolation in double quotes.
A failed hero background that renders dark/empty after swapping in a new asset is the
tell-tale symptom.
