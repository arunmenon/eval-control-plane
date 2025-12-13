# Architecture Decision Records (ADRs)

This folder contains Architecture Decision Records for this project, using the Nygard ADR format.

## Purpose

- Capture architecturally significant decisions and their rationale.
- Provide a changelog of the architecture as it evolves.
- Make reversals and superseded decisions explicit.

## Location and naming

- All ADRs live under `docs/adr/`.
- Files are named with a zero-padded sequence and a short, kebab-case slug:
  - `NNNN-short-descriptive-title.md`
  - Example: `0001-record-architecture-decisions.md`.

The sequence number is monotonically increasing and never reused, even if an ADR is withdrawn or superseded.

## ADR template

Each ADR follows the Nygard structure:

- **Title**
- **Status** (e.g., Proposed, Accepted, Rejected, Superseded)
- **Context**
- **Decision**
- **Consequences**

You can copy an existing ADR file as a starting point and adjust the content and status.

## Workflow

1. When you make a significant architectural decision, add a new ADR:
   - Pick the next sequence number.
   - Choose a concise slug that reflects the decision.
   - Start with `Status: Proposed`.
2. Discuss and review the ADR in code review.
3. Once agreed, update the status to `Accepted`.
4. If a later ADR replaces an earlier one:
   - Set the old ADR to `Status: Superseded by ADR-NNNN`.
   - Reference the new ADR in the old one and vice versa.

