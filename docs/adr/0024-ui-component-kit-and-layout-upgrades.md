# 0024: UI component kit and dashboard/run detail layout upgrades

**Status:** Accepted

## Context

The initial web UI already exposes the core routes and concepts of the evaluation control plane (benchmarks, packs, runs, leaderboards) and a dark-slate visual theme (see ADRs 0014–0016). However, several aspects still read as a prototype:

- Primary actions and navigation links use default anchor styling or ad-hoc pills, making CTAs hard to distinguish and the app feel “wiki-like”.
- High-value content such as “Recent runs”, “Top packs”, scoring-mode distribution, and backend usage is rendered as unordered lists instead of structured, scannable data UI.
- The run detail page presents scores, configuration and metrics in a single scrolling block with limited hierarchy, which makes it harder to treat as a “trust center” for leadership demos.

We want a UI that feels like a modern internal control plane (Linear/Vercel/Stripe admin tier), while staying simple and framework-agnostic (no Tailwind or design system dependency).

## Decision

We will introduce a small UI component kit and apply it to the dashboard and run detail pages:

1. **Button and Badge primitives**
   - Define consistent button styles for primary, secondary, and ghost actions, plus a text-like link style that avoids default purple/underlined anchors.
   - Continue to use badge styles for status and scoring-mode chips, but align color usage and spacing so badges read as “labels” not buttons.

2. **Dashboard layout upgrades**
   - Keep the existing hero card (title, subtitle, high-level metrics) but style hero CTAs as primary/secondary buttons.
   - Replace the “Recent runs” unordered list with a compact table showing run name, status pill, pack score, and created time, with each row linking to run detail.
   - Replace the “Top packs” unordered list with a more structured card list where each entry shows pack name/version, number of runs, and actions to open the leaderboard or launch a run.
   - Render scoring-mode and backend distributions as structured bar-style summaries instead of raw bullet counts, while still using simple CSS for implementation.

3. **Run detail layout upgrades**
   - Enhance the run header so status, scoring mode and backend are surfaced as badges alongside the run name, and the pack score is highlighted in a dedicated “score” row.
   - Prepare for a future tabbed layout (“Overview / Metrics / Scoring / Artifacts / Samples”) by making the current sections clearly delineated and more visually grouped (score summary, scoring configuration, and task metrics table).
   - Keep the existing task-metrics table for now, but group the surrounding context (run metadata, scoring configuration, samples link affordances) to make the page feel like a coherent trust surface.

4. **Implementation constraints**
   - Implement the component kit using plain React components and the existing `globals.css` file: no new runtime UI dependencies are introduced.
   - Changes are applied incrementally to current pages (home, packs, run detail) without breaking existing routes or API contracts.

## Consequences

Positive:

- The dashboard now uses tables and structured cards instead of bullet lists, which makes it much easier to scan for “What ran recently?” and “Which packs are hot?” in a leadership demo.
- Primary actions such as “Launch run”, “Open packs”, “Run this pack”, and “View leaderboard” are visually distinct and consistently styled, reducing ambiguity for new users.
- Run detail has clearer hierarchy: run identity + status + scoring mode + pack score stand out at the top, while configuration and metrics remain accessible below.
- The UI improvements are implemented entirely in the existing Next.js codebase with minimal CSS additions, so they are easy to maintain and extend.

Negative / trade-offs:

- There is a small increase in CSS surface area (additional button styles, stat-like layouts, and bar summaries) that must be kept consistent across future pages.
- Run detail still uses a single-page layout without tabs; further restructuring (e.g., full tabbed view, sample explorer in-page) will require follow-up changes and likely a dedicated ADR.

Follow-ups:

- Add proper tabbed navigation and score cards to the run detail page once we integrate end-to-end LightEval execution and richer artifact metadata.
- Extend the UI component kit with explicit `EmptyState` and `Skeleton` patterns to make loading/empty views feel intentional rather than blank.

