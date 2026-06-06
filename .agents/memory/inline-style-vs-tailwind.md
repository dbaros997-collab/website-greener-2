---
name: Inline style vs Tailwind responsive classes
description: Why responsive show/hide silently fails on grace-high-school components
---

# Inline `style` silently defeats Tailwind responsive classes

In `artifacts/grace-high-school/src/App.tsx` (and similar single-file artifacts), components mix
inline `style={{...}}` objects with Tailwind utility classes like `className="hidden md:flex"`.

**Rule:** An inline `style` property ALWAYS wins over a Tailwind utility class for the same CSS
property, because inline styles have higher specificity than class selectors (and Tailwind utilities
are not `!important` by default).

**Bite:** The desktop nav `<ul>` had both `style={{ display:"flex" }}` and `className="hidden md:flex"`.
The inline `display:flex` overrode `hidden`, so the desktop links never collapsed to the hamburger on
mobile — links overflowed the bar at phone widths.

**Why:** specificity, not a Tailwind bug.

**How to apply:** When you want a Tailwind responsive class (`hidden`, `md:flex`, `md:hidden`, etc.) to
control a CSS property, do NOT also set that same property inline. Remove the inline `display` (keep
unrelated inline props like `gap`/`alignItems`) and let the utility class drive it.
