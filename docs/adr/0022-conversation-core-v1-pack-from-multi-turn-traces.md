## ADR-0022: Conversation Core v1 pack from multi-turn traces

**Status:** Accepted

### Context

We have a golden evaluation dataset for conversation agents:

- `reasoning-model-trainer/examples/multi_turn_traces_eval.jsonl`

Each line contains:

- `conversation_id`
- `metadata` (e.g., `intents`, `decision_category`, `difficulty`)
- `messages` – multi-turn chat with system/user/assistant/tool roles, tool plans, and tool calls.

This dataset is ideal for testing routing, tool usage, and overall conversation quality.
We want a first-class **Conversation Core v1** pack in the platform that:

- uses this dataset as its conceptual source,
- exposes clear, leadership-friendly metrics,
- and can be seeded for demo purposes without waiting on real LightEval runs.

### Decision

We define the **Conversation Core v1** pack and its benchmarks as follows:

#### Benchmarks

We add three benchmarks to the `benchmarks` table:

- `conv_router_intent`
  - Source: multi-turn traces eval dataset.
  - Concept: accuracy of intent routing and decision category.
  - Key fields:
    - `benchmark_key = "conv_router_intent"`
    - `suite = "conversation"`
    - `task_name = "conv_router_intent"`
    - `source_type = "conversation_seed"`
    - `scoring_mode = "deterministic"`
  - Metrics (conceptual):
    - `intent_accuracy`
    - `intent_f1` (optional)
    - `decision_accuracy`

- `conv_tool_routing`
  - Source: same traces, focusing on tool usage.
  - Concept: correctness of tool routing and call structure.
  - Key fields:
    - `benchmark_key = "conv_tool_routing"`
    - `suite = "conversation"`
    - `task_name = "conv_tool_routing"`
    - `source_type = "conversation_seed"`
    - `scoring_mode = "deterministic"`
  - Metrics (conceptual):
    - `tool_success_rate`
    - `tool_call_precision` / `tool_call_recall` (optional)
    - `format_valid`

- `conv_helpfulness_core`
  - Source: same traces, but scored via LLM-as-judge.
  - Concept: overall quality of the assistant’s behavior in the conversation.
  - Key fields:
    - `benchmark_key = "conv_helpfulness_core"`
    - `suite = "conversation"`
    - `task_name = "conv_helpfulness_core"`
    - `source_type = "conversation_seed"`
    - `scoring_mode = "judge"` or `jury` (depending on run).
  - Metrics (conceptual):
    - `helpfulness_score`
    - `instruction_following_score`
    - `safety_score` (optional)
    - `overall_judge_score` (headline metric)

In this initial ADR, we seed only the benchmark definitions and demo metrics in the DB.
Actual LightEval tasks and judge metrics for these benchmarks will be implemented separately.

#### Pack: Conversation Core v1

We add a `packs` row:

- `name = "Conversation Core v1"`
- `version = "1.0"`
- `description = "Conversation agents core evaluation: routing, tools, and helpfulness."`
- `primary_metric = "overall_judge_score"`
- `aggregation = "mean"`
- `tags = ["conversation", "core"]` (JSON-encoded string in the current schema)

And three `pack_tasks` rows linking to the benchmarks:

- `task_spec = "conv_router_intent"`
- `task_spec = "conv_tool_routing"`
- `task_spec = "conv_helpfulness_core"`

Each with default `fewshot = 0` and `weight = 1.0` for now.

#### Demo runs (for VP demo)

We seed at least two demo runs for this pack:

- `Conversation Core v1 – conv-model-a`
  - `scoring_mode = "judge"`
  - Example metrics:
    - `conv_router_intent.intent_accuracy = 0.80`
    - `conv_tool_routing.tool_success_rate = 0.75`
    - `conv_helpfulness_core.overall_judge_score = 0.78`

- `Conversation Core v1 – conv-model-b`
  - `scoring_mode = "judge"`
  - Example metrics (slightly better):
    - `conv_router_intent.intent_accuracy = 0.85`
    - `conv_tool_routing.tool_success_rate = 0.78`
    - `conv_helpfulness_core.overall_judge_score = 0.82`

These seeded runs:

- appear in `/packs`, `/runs`, `/leaderboards/:packId`, and `/runs/:runId`,
- use realistic-looking metrics so leadership can compare models,
- and do not depend on real LightEval executions yet.

### Consequences

- (+) Conversation agents become a first-class story in the platform via `Conversation Core v1`.
- (+) Leadership can see routing, tools, and overall helpfulness scores side by side.
- (+) The pack and benchmarks are grounded in the existing multi-turn traces eval dataset, even if the demo seed uses synthetic metrics.
- (-) We must still implement the underlying LightEval tasks and judge metrics to make this pack “live” for real models.
- (-) The demo metrics are illustrative; they are not derived from actual model behavior until LightEval integration is wired for these tasks.

