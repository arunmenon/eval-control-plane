## ADR-0014: Web UX baseline and leadership demo layout

**Status:** Accepted

### Context

We have a working web UI (Next.js) that exposes the core flows (benchmarks, packs, runs, leaderboards, run details, sample explorer), but the initial implementation is intentionally minimal.
We need a more polished, leadership-ready UX that:

- presents the main concepts (Benchmarks, Packs, Runs, Leaderboards) clearly,
- highlights scoring modes (deterministic, judge, jury) consistently,
- supports basic discovery (search/filter) without complex client-side state,
- and uses a simple, consistent visual language that is easy to extend.

We want to achieve this without introducing a heavy design system or complex CSS tooling.

### Decision

- We will standardize a lightweight UX baseline for the web app:
  - A global layout with:
    - a top navigation bar (Benchmarks, Packs, Runs, Leaderboards),
    - a constrained content width and consistent spacing,
    - simple cards, tables, and badges as core building blocks.
  - Per-page structures aligned with the product vocabulary:
    - Benchmarks: searchable list with suite + scoring badges.
    - Packs: cards and detail pages showing tasks and scoring modes.
    - Runs: list with status, scoring badges, pack scores, and links.
    - Leaderboards: table ranked by pack score with scoring/backend badges.
    - Run detail: summary, scoring config (for judge/jury), task metrics, and sample explorer links.
- Interactions will be implemented using:
  - server-side rendering with query parameters for search/filter (no heavy client-side state),
  - simple forms that submit via GET (e.g., search boxes and filters).
- Styling will remain CSS-based (`globals.css`) with a small set of utility-like classes (cards, tables, badges, muted text, form fields, buttons) that can be reused across pages.

### Consequences

- (+) The UI becomes significantly more presentable for leadership demos:
  - clear navigation,
  - consistent visual hierarchy,
  - explicit scoring mode badges,
  - basic search and filter controls.
- (+) The approach remains lightweight and framework-native:
  - no additional design system or CSS tooling is introduced,
  - pages remain easy to reason about and extend.
- (+) The UX is closely aligned with the underlying data model and LightEval concepts already captured in other ADRs.
- (-) This is not a full-blown component library; deeper customization or theming will require incremental work on `globals.css` and page components.
- (-) Some interactions (e.g., dynamic faceted filtering) are intentionally kept simple (form + querystring) to avoid overcomplicating the initial implementation.

