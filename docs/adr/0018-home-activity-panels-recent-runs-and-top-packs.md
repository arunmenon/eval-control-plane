## ADR-0018: Home activity panels – recent runs and top packs

**Status:** Accepted

### Context

The home dashboard currently shows aggregate counts (packs, runs, completed runs) and entry points, but leadership viewers benefit from seeing concrete activity as well.
Two high-signal panels are:

- “Recent runs” – what just happened, with status and scores.
- “Top packs” – which packs are being used most often.

### Decision

- We will extend the home page with two activity panels:
  - **Recent runs**:
    - Shows up to 4 most recent runs (by `created_at`) across all statuses.
    - Each entry displays:
      - run name or ID,
      - status pill,
      - scoring mode badge,
      - pack score when available.
    - Uses existing `GET /api/runs` data (sorted by `created_at desc`).
  - **Top packs**:
    - Shows up to 3 packs with the highest number of runs in the current window (based on the same `/api/runs` data).
    - Each entry displays:
      - pack name and version,
      - approximate run count (number of runs returned for that pack),
      - a link to the pack detail and its leaderboard.
- Implementation details:
  - The home page will fetch `packs` and `runs` server-side, then derive:
    - recent runs = first N runs from `/api/runs`,
    - top packs = packs sorted by count of runs in that result set.
  - No new summary API is introduced at this stage; we rely on existing endpoints.

### Consequences

- (+) The home page feels more dynamic and informative with minimal added complexity.
- (+) Leadership sees both “what we have” (counts) and “what’s happening” (recent runs, top packs).
- (-) Top packs are approximate, based on the latest runs returned by `/api/runs` (currently limited to 50).

