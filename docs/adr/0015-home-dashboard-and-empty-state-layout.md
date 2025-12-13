## ADR-0015: Home dashboard and empty-state layout

**Status:** Accepted

### Context

The initial web UI exposes the core pages (benchmarks, packs, runs, leaderboards), but the home page and some list views feel visually sparse when there is little or no data.
For leadership demos, we want the main landing view to:

- immediately communicate that the platform is active and structured,
- surface a small set of key stats (e.g., packs, runs, completed runs),
- and provide clear “next actions” even when there is no data yet.

We also want simple, informative empty states on list pages instead of bare tables with no rows.

### Decision

- We will enhance the home page with a lightweight dashboard:
  - three summary tiles showing:
    - number of packs,
    - number of runs,
    - number of completed runs,
  - a “Next actions” card that links to creating packs and runs.
  - Data is obtained via existing API endpoints (`/api/packs`, `/api/runs`), using approximate counts from the returned collections.
- We will improve empty states on list pages (benchmarks, packs, runs, leaderboards) by:
  - retaining the current “no data” messages,
  - embedding them in the existing card-based visual language to avoid large blank areas.

These changes aim to improve perceived richness and clarity without introducing heavy charts or additional dependencies.

### Consequences

- (+) The home page immediately shows that the system is “alive” (even with minimal data).
- (+) Leadership viewers see the key nouns and counts at a glance.
- (+) All major list pages present better empty states, making the UI feel intentional rather than unfinished.
- (-) Summary stats are based on sampled API responses rather than dedicated aggregate endpoints; for very large datasets, we may later introduce optimized aggregate queries.

