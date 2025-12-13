# ADR Implementation Tracker

This document tracks the implementation status of each ADR in this repository.

Status here refers to **implementation in the codebase**, not the ADR’s own decision status.

## Legend

- **Not started** – ADR is documented but not yet reflected in code.
- **In progress** – Initial implementation exists, but is incomplete.
- **Implemented** – Code and/or infrastructure exists and is aligned with the ADR.
- **Superseded** – ADR has been replaced; see the ADR file for details.

## ADRs

| ADR ID  | Title                                                                 | Implementation status |
|--------|-----------------------------------------------------------------------|-----------------------|
| 0001   | Record architecture decisions                                         | Implemented           |
| 0002   | LightEval integration via CLI-first runner                            | Implemented           |
| 0003   | Artifact contract and storage layout                                  | Implemented           |
| 0004   | Results JSON is source of truth; normalize for querying               | Implemented           |
| 0005   | Benchmark registry from LightEval task discovery + pack curation      | Implemented           |
| 0006   | Explicit scoring modes: deterministic vs judge vs jury                | Implemented           |
| 0007   | Details Parquet is read-on-demand (no sample rows in DB)              | Implemented           |
| 0008   | Worker pools split by execution plane (GPU vs endpoint)               | Not started           |
| 0009   | Evaluation framework architecture: Registry → Runner → Results        | Implemented           |
| 0010   | JobSpec API contract between platform and runner                      | Implemented           |
| 0011   | Judge/jury execution semantics and scoring config propagation         | Implemented           |
| 0012   | Judge/jury task plugins and pack mapping                              | Implemented           |
| 0013   | Database backend – SQLite for local development                       | Implemented           |
| 0014   | Web UX baseline and leadership demo layout                            | Implemented           |
| 0015   | Home dashboard and empty-state layout                                 | Implemented           |
| 0016   | Visual theme – dark slate leadership mode                             | Implemented           |
| 0017   | VP demo seed data                                                     | Implemented           |
| 0018   | Home activity panels – recent runs and top packs                      | Implemented           |
| 0019   | Run comparison view                                                   | Implemented           |
| 0020   | Benchmark detail tabs                                                 | Implemented           |
| 0021   | Conversation agents – benchmarks, packs, and metrics                  | Implemented           |
| 0022   | Conversation Core v1 pack from multi-turn traces                      | Implemented           |

Update this table as implementation progresses, and cross-reference specific modules, services, or migrations where relevant.
