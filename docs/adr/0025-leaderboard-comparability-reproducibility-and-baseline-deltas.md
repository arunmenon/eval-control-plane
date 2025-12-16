# 0025: Leaderboard comparability, reproducibility, and baseline deltas

**Status:** Accepted

## Context

The platform already ingests LightEval results JSON and task hashes (see ADRs 0003–0004, 0007) and exposes a pack-level leaderboard view (see ADR 0014 and 0018). However, from a leadership and governance perspective, three important questions remain hard to answer at a glance:

- “Which runs are **reproducible**?” – i.e., do we have sufficient hash metadata to rerun and verify them?
- “Which runs are **comparable**?” – i.e., are we comparing scores that were computed under the same scoring regime?
- “How much better is this run than our **baseline**?” – i.e., what is the improvement or regression relative to an agreed reference point.

To support a credible VP demo, we want lightweight but real answers to these questions in both the leaderboard and the run detail view, without changing the underlying LightEval artifact contract.

## Decision

We introduce three derived concepts computed from existing database rows:

1. **Reproducible run (isReproducible)**
   - A run is considered *reproducible* if:
     - it has at least one `RunTaskHash` row, and
     - for every `RunTaskHash` row attached to the run, all hash fields are present and non-null:
       - `hash_examples`
       - `hash_full_prompts`
       - `hash_input_tokens`
       - `hash_cont_tokens`
   - This is a pragmatic approximation of the “all hashes present” rule suggested in the LightEval docs, adapted to the schema we already store.

2. **Comparable run (isComparable)**
   - Comparability is defined within a **pack + scoring_mode** cohort.
   - For leaderboard computations:
     - We derive a **baseline run** as the earliest completed run for the pack that has a non-null `pack_score`.
     - All leaderboard entries whose `scoring_mode` matches the baseline run’s `scoring_mode` are marked as `isComparable = true`.
     - Entries with different scoring modes are considered `isComparable = false` and should not be used for direct score comparisons to the baseline.
   - For the run detail page:
     - We compute a baseline run restricted to `{ pack_id, scoring_mode, status="completed", pack_score != null }`.
     - If such a baseline exists and the current run has a non-null `pack_score`, the run is considered `isComparable = true` relative to that baseline.

3. **Baseline score and delta (baselineScore, deltaFromBaseline)**
   - For a given pack:
     - The **leaderboard baseline** is defined as the earliest completed run (by `created_at`) with a non-null `pack_score`, regardless of backend.
     - The leaderboard API returns:
       - `baselineScore` – the baseline run’s `pack_score`.
       - For each leaderboard entry, `deltaFromBaseline = packScore - baselineScore` when both are present.
   - For a specific run:
     - The **run-level baseline** is defined as the earliest completed run for the same `pack_id` and `scoring_mode` with a non-null `pack_score`.
     - The run detail API returns `baselineScore` and `deltaFromBaseline` for that cohort.

### Implementation details

- **API: `/api/runs/:runId`**
  - Adds derived fields to the returned `run` object:
    - `isReproducible` – boolean computed from `RunTaskHash` rows.
    - `baselineScore` – earliest completed run’s `pack_score` in the same pack + scoring_mode cohort, or `null` when none exists.
    - `deltaFromBaseline` – difference between this run’s `pack_score` and `baselineScore`, or `null` when either is missing.
    - `isComparable` – boolean indicating whether this run has a valid baseline and score (same pack and scoring_mode).

- **API: `/api/leaderboards/:packId`**
  - Now includes:
    - `baselineScore` – pack-level baseline score for the leaderboard.
    - For each leaderboard entry:
      - `isReproducible` – computed from `RunTaskHash` rows.
      - `isComparable` – true if the entry’s `scoring_mode` matches the baseline run’s `scoring_mode`.
      - `deltaFromBaseline` – as defined above.

- **Web UI**
  - Leaderboard UI:
    - Displays `baselineScore` and a note that deltas are relative to the earliest completed run.
    - Adds a “Δ vs baseline” column showing `+/-` deltas where available.
    - Adds badges per row:
      - `Reproducible` when `isReproducible` is true.
      - `Comparable` when `isComparable` is true.
  - Run Detail UI:
    - Uses `baselineScore`, `deltaFromBaseline`, `isReproducible`, and `isComparable` from the run API to present:
      - A richer score card (score + bar; copy can mention baseline when present).
      - Room for future badges (e.g., “Reproducible”, “Comparable”) near the run header.

## Consequences

Positive:

- Leaders and engineers can immediately see which leaderboard rows are safe to compare and which ones are backed by strong artifact metadata.
- The baseline and delta view make performance improvements or regressions easy to explain (e.g., “+0.04 vs baseline”).
- These features are implemented as derived fields in the API, without altering the underlying Prisma schema or the LightEval artifact contract.

Negative / limitations:

- The baseline definition (“earliest completed run with a score”) is a simple heuristic and might not match future governance policies (e.g., “official baselines”).
- Comparability is limited to scoring_mode and does not yet account for differences in judge configuration, backend, or generation parameters.
- Reproducibility currently uses only per-task hashes; it does not check for a top-level `summary_general.hashes` section in the raw JSON.

Follow-ups:

- Introduce an explicit notion of an “official baseline run” per pack (e.g., via a flag or separate table) instead of always using the earliest run.
- Extend comparability checks to include judge configuration, backend grouping, and generation parameters as needed.
- Propagate reproducibility and comparability badges into more UI surfaces (run comparison view, packs detail) once the semantics are stable.

