## ADR-0016: Visual theme – dark slate leadership mode

**Status:** Accepted

### Context

The initial web UI used a light background with white cards and subtle accents. While functional, it felt overly white and visually sparse on large displays, especially in early demo stages where data is limited.
For leadership demos, we want a more distinctive, high-contrast look that:

- feels intentional and premium,
- makes key metrics and statuses stand out,
- and remains simple to maintain without a full design system.

### Decision

- We will adopt a **dark slate** visual theme for the app shell:
  - Body background: a dark, subtle gradient (slate/indigo range) instead of flat white.
  - Cards and tables: dark surfaces (`#020617`/`#0b1120`) with lighter borders and high-contrast text.
  - Header: dark bar with gradient logo mark and light navigation links.
- Accent colors:
  - Primary: blue (`#3b82f6` / `#2563eb`) for CTAs.
  - Status pills: green (completed), blue (running), yellow (queued), red (failed).
  - Scoring badges: existing deterministic/judge/jury colors, tuned for the dark background.
- Form controls and tables will be restyled for dark mode:
  - Inputs/selects: dark backgrounds, light text, neutral borders.
  - Tables: darker rows with subtle separators and readable header contrast.

We will continue to implement this with plain CSS in `globals.css`, without introducing a new design framework.

### Consequences

- (+) The UI feels significantly less “white” and more like a polished dashboard suitable for leadership demos.
- (+) Status and scoring modes are more legible at a glance due to higher contrast.
- (+) The theme remains lightweight and easy to adjust in one place (`globals.css`).
- (-) Light theme is not currently available as a toggle; switching themes later will require additional work.
- (-) Custom visual components added in the future must consider dark backgrounds from the outset.

