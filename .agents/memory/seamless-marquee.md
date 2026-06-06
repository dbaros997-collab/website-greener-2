---
name: Seamless CSS marquee
description: How to build a continuously-scrolling, seamless image/photo carousel with pure CSS in this repo.
---

For a continuously sliding photo strip (Gayaza-style moving gallery), render the
item list **twice** (`[...items, ...items]`) inside a track and animate the track
`translateX(0)` → `translateX(-50%)` with `linear infinite`. At -50% the second
copy sits exactly where the first started, so the loop is invisible.

**Why margin-right, not flex `gap`:** the -50% reset only lands seamlessly if the
half-track width is an exact multiple of one item's footprint. Flex `gap` adds
space *between* items but not after the last one, so the two halves aren't equal
width and the seam visibly jumps. Put the spacing as `margin-right` on each card
instead — then every card (including the last of each half) carries the same
footprint and -50% is exact.

**How to apply:**
- Track: `display:flex; width:max-content; animation: <name> linear infinite;`
- Card: `flex:0 0 auto; width:<fixed>; margin-right:<gap>;` (no flex `gap`).
- Pause on hover: `.marquee:hover .marquee-track { animation-play-state: paused; }`
- Scale `animationDuration` to item count (inline) so more photos ≠ faster scroll.
- Accessibility: add `@media (prefers-reduced-motion: reduce)` to set
  `animation:none` (and make the container `overflow-x:auto` so it's still
  browsable). For JS auto-advance (e.g. hero slideshow interval), early-return the
  effect when `matchMedia("(prefers-reduced-motion: reduce)").matches`.
