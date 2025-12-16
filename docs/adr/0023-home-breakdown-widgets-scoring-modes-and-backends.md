## ADR-0023: Home breakdown widgets – scoring modes and backends

**Status:** Accepted

### Context

The home page currently shows:

- a hero section with high-level counts (packs, runs, completed runs),
- a "Recent runs" panel,
- and a "Top packs" panel.

For leadership demos, it is helpful to also show:

- a breakdown of how runs are being scored (deterministic vs judge vs jury),
- and which backends are being used (e.g., endpoint vs local GPU).

We already expose this information in `/api/runs` (`scoring_mode` and `backend_type`), so we can derive simple breakdown widgets without new backend endpoints.

### Decision

- We will add two additional widgets to the home page:
  - **Scoring modes**:
    - Shows how many runs are using each scoring mode:
      - deterministic
      - judge
      - jury
    - Derived from the `scoring_mode` field on runs returned by `GET /api/runs`.
  - **Backends**:
    - Shows how many runs used each backend type (e.g., `endpoint_demo`, `vllm`, `accelerate`).
    - Derived from the `backend_type` field on the same runs.
- Implementation details:
  - The existing `fetchSummary` function on the home page already fetches packs and runs.
  - We will:
    - count runs per scoring mode and per backend type,
    - expose these counts to the component,
    - render them in two additional cards below "Recent runs" and "Top packs".
  - We will keep the layout simple and consistent with existing cards.

### Consequences

- (+) Leadership can see at a glance:
  - how much of the platform usage is deterministic vs judge/jury,
  - and what execution surfaces (backends) are being exercised.
- (+) No new backend endpoints or jobs are required; we reuse `/api/runs`.
- (-) The breakdown is approximate and limited to the most recent N runs returned by `/api/runs` (currently capped at 50).

