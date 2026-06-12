---
name: Grace gallery grid tiling
description: How to pick wide/single gallery tiles so the 3-column grid has no empty holes
---

The "Life at Grace High School" gallery is a fixed 3-column CSS grid where a `wide` tile spans 2 columns and a normal tile spans 1. Empty holes appear unless the per-row spans add up to a multiple of 3.

**Rule:** when editing the gallery item list, keep the total column-span a multiple of 3. The clean arrangement for N items is `wide + single` pairs (each row = span2 + span1 = 3). For 6 items that means exactly **3 wide + 3 single**. With auto-flow (non-dense), the item immediately after a wide must be a single so each wide pairs with a single in the same row.

**Why:** a mix like 4 wide + 2 single sums to 10 (not divisible by 3), so two cells stay empty and the grid shows visible holes. `grid-auto-flow: dense` only partially backfills and can reorder tiles, so it is not a real fix — rebalance the wide/single counts instead.

**How to apply:** after any add/remove/reorder of gallery photos, recount wide vs single. A landscape ~1.5:1 photo (most school photos) fits a single tile (~1.55:1) almost exactly with minimal crop, but a wide tile is ~3:1 and crops it into a thin strip — so prefer `single` for photos whose subjects you don't want cropped, and reserve `wide` for ones that read well cropped short.
