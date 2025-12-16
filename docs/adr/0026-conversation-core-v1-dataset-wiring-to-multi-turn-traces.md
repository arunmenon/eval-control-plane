# 0026: Conversation Core v1 dataset wiring to multi_turn_traces_eval.jsonl

**Status:** In progress

## Context

ADRs 0021 and 0022 define the vocabulary and pack composition for Conversation Core v1:

- Benchmarks:
  - `conv_router_intent` – conversation intent routing accuracy.
  - `conv_tool_routing` – tool routing and call structure.
  - `conv_helpfulness_core` – judge-based conversation helpfulness and overall quality.
- Pack:
  - `Conversation Core v1` = { `conv_router_intent`, `conv_tool_routing`, `conv_helpfulness_core` }, with primary metric `overall_judge_score`.

Until now, these benchmarks were seeded purely as demo entities (with placeholder dataset metadata and synthetic scores). In parallel, the `reasoning-model-trainer` repository already contains a golden evaluation dataset for conversation agents:

- `reasoning-model-trainer/examples/multi_turn_traces_eval.jsonl`
- Each line contains:
  - `conversation_id`
  - `metadata` (e.g., `intents`, `decision_category`, `difficulty`)
  - `messages` (system/user/assistant/tool, with `reasoning`, `tool_plan`, `tool_calls`, etc.)

We want Conversation Core v1 in the control plane to point at this real dataset, so the benchmarks are grounded even before full LightEval task plugins and metrics are implemented.

## Decision

1. **Record dataset wiring in Benchmark metadata**
   - For the three conversation benchmarks (`conv_router_intent`, `conv_tool_routing`, `conv_helpfulness_core`), we will:
     - Set `hf_repo` to a descriptive local identifier: e.g., `"local:multi_turn_traces_eval"`.
     - Set `hf_subset` to `"default"` (there is a single logical split in the JSONL file).
     - Set `evaluation_splits` to `["eval"]`.
     - Set `hf_revision` to a simple version string such as `"v1"` to indicate the dataset snapshot version.
   - This wiring is applied in the demo seed script so the DB rows reflect the real dataset, and the UI (Benchmark detail, Pack detail) can display meaningful dataset information.

2. **Store local dataset path in pack task overrides**
   - For `Conversation Core v1` pack tasks, we add a `dataset_path` field in `PackTask.overrides` for the three conversation benchmarks:
     - `overrides.dataset_path = "../reasoning-model-trainer/examples/multi_turn_traces_eval.jsonl"`.
   - This is a pragmatic, local-development pointer that:
     - documents where the data lives,
     - allows future runners or plugins to discover and load the JSONL without hardcoding paths elsewhere.

3. **Defer full LightEval task plugin implementation**
   - A dedicated LightEval task plugin module (e.g., `conversation_tasks.py` under `services/runner`) will:
     - load `multi_turn_traces_eval.jsonl` (likely via `datasets.load_dataset("json", data_files=...)`),
     - expose tasks `conv_router_intent`, `conv_tool_routing`, and `conv_helpfulness_core` via `LightevalTaskConfig` entries and a `TASKS_TABLE`,
     - define metrics:
       - `intent_accuracy`, `decision_accuracy` for router,
       - `tool_success_rate`, `format_valid` for tools,
       - `helpfulness_score`, `overall_judge_score` (judge-based) for helpfulness.
   - Implementation of this plugin and the associated metric functions is deferred to a follow-up iteration once we are ready to run Conversation Core v1 end-to-end through LightEval.

## Consequences

Positive:

- Conversation Core v1 benchmarks in the control plane are now clearly wired to a real golden dataset (`multi_turn_traces_eval.jsonl`), which improves credibility in the UI and ADRs.
- Future LightEval task plugins and runners can discover the dataset path via `PackTask.overrides` instead of relying on hardcoded paths.
- No changes to Prisma schema or existing API contracts are required; only seed data and metadata are updated.

Negative / limitations:

- At this stage, metrics for conversation runs are still seeded and do not yet result from running LightEval against `multi_turn_traces_eval.jsonl`.
- The dataset path is specific to the current mono-repo layout and is intended for local development; production deployments will likely require a more portable storage mechanism (e.g., object storage URI or dataset registry).
- The LightEval plugin for conversation tasks is not yet implemented; attempting to run these tasks through LightEval will require additional work.

Follow-ups:

- Implement a real conversation tasks plugin module for LightEval that uses `multi_turn_traces_eval.jsonl` as the source dataset and exposes the three conversation benchmarks as tasks.
- Update the Node/TypeScript runner integration to attach the conversation plugin via `--custom-tasks` when running Conversation Core v1, using the `Plugin` table and `PackTask.overrides`.
- Gradually replace seeded conversation scores with actual scores computed by the LightEval plugin and ingestion logic, validating the metrics against the intended definitions in ADR 0021.

