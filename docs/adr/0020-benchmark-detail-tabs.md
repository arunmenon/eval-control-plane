## ADR-0020: Benchmark detail tabs

**Status:** Accepted

### Context

Benchmark detail currently presents information in a single column, which can feel dense and less structured for leadership viewers.
We want to:

- clearly separate overview, dataset, metrics, requirements, and “how to run” guidance,
- keep navigation simple and URL-based (no complex client-side state).

### Decision

- We will restructure the benchmark detail page into simple URL-driven tabs:
  - Tabs:
    - `Overview` – description, suite, scoring mode, high-level info.
    - `Dataset` – HF repo, subset, splits, revision.
    - `Metrics` – list of metrics with “higher is better” information.
    - `Requirements` – any additional requirements from LightEval.
    - `How to run` – brief explanation and a generic CLI example using the benchmark key.
  - Implementation:
    - Tabs are rendered as links that set `?tab=overview|dataset|metrics|requirements|how-to-run`.
    - The page reads `searchParams.tab` and conditionally renders the corresponding section.
    - A default tab (`overview`) is used when `tab` is missing or invalid.

This keeps the benchmark detail page easy to navigate and understand, without introducing a complex tab component system.

### Consequences

- (+) Benchmark information is easier to scan and present to leadership.
- (+) Tabs are URL-addressable and shareable (e.g., “open metrics tab”).
- (-) This adds a small amount of routing complexity via `searchParams`, but remains SSR-friendly.

