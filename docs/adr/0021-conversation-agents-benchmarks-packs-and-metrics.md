## ADR-0021: Conversation agents – benchmarks, packs, and metrics

**Status:** Accepted

### Context

We are extending the platform to support evaluation of **conversation agents** (chatbots / assistants).
The existing system already defines:

- **Benchmarks** – definitions of what to evaluate (dataset + prompt mapping + metrics).
- **Packs** – curated sets of benchmarks, forming the units we show on leaderboards.
- **Runs** – executions of a model on a pack, producing LightEval artifacts.
- **Metrics** – numeric or boolean scores per task and per run.

For conversation agents, we need:

- a clear mapping between these concepts,
- a small set of canonical benchmarks and packs,
- and a curated set of evaluation metrics (deterministic and judge/jury) that leadership can understand.

### Definitions (platform vocabulary)

- **Task / Benchmark** (we call it a “Benchmark” in the UI)
  - One *definition* of an evaluation:
    - which dataset(s) to use (e.g., prompts and expected behavior),
    - how to turn dataset rows into prompts,
    - which metrics to compute.
  - In LightEval terms, this corresponds to a `LightevalTaskConfig` (a “task”).
  - In our DB, this is a row in `benchmarks`.

- **Metric**
  - A function that scores model outputs for a benchmark.
  - Sample-level: one score per example (e.g., helpfulness score 1–5).
  - Corpus-level: aggregated across all examples (e.g., mean helpfulness).
  - In LightEval, metrics are part of the task configuration; in our DB, we store metric results in `run_task_metrics` and `run_scores`.

- **Pack**
  - A curated set of benchmarks plus a scoring policy:
    - which benchmarks are “in the pack”,
    - how they are weighted,
    - which metric is the primary headline score.
  - Packs are what leadership cares about and what our leaderboards are based on.
  - In the DB, a pack is a `packs` row plus `pack_tasks` rows for the member benchmarks.

- **Run**
  - One execution of a model on a pack (with a given backend and scoring mode).
  - Produces LightEval artifacts and fills `runs`, `run_artifacts`, `run_task_metrics`, `run_scores`, etc.

### Decision

For **conversation agents**, we introduce:

#### Benchmarks (conversation tasks)

We will define a small set of conversation-focused benchmarks, each as a `Benchmark` row and a corresponding LightEval task or plugin:

- `open_chat_helpfulness`
  - General multi-turn chat; measures how helpful and clear the assistant is.
- `instruction_following_chat`
  - Focuses on following detailed instructions (steps, style, constraints).
- `safety_guardrail_chat`
  - Probes whether the assistant avoids unsafe / disallowed content.
- `grounded_qa_chat`
  - Question answering with provided context; measures faithfulness to context.
- `tool_use_chat`
  - Multi-turn interactions that require deciding when/how to call tools and return structured outputs.

For each benchmark we will:

- register a `benchmarks` row with a canonical `benchmark_key`,
- point to a LightEval task (built-in or custom plugin),
- and record which metrics it emits.

#### Packs (conversation bundles)

We will define at least three canonical packs:

- **Conversation Core v1**
  - Benchmarks:
    - `open_chat_helpfulness`
    - `instruction_following_chat`
    - `safety_guardrail_chat`
  - Scoring:
    - `primary_metric = "overall_judge_score"`
    - `aggregation = "mean"` across pack tasks (optionally weighted).
  - Scoring mode:
    - typically `judge` or `jury`, depending on the run.

- **Conversation Safety v1**
  - Benchmarks:
    - `safety_guardrail_chat` plus any additional safety datasets.
  - Scoring:
    - `primary_metric = "safety_score"`.
  - Focused on safety and harmlessness.

- **Conversation Tools v1**
  - Benchmarks:
    - `tool_use_chat` and related tool/JSON-format tasks.
  - Scoring:
    - `primary_metric = "tool_success_rate"`.
  - Primarily deterministic scoring (format and correctness).

These packs will be created in the `packs` and `pack_tasks` tables, and will appear in the UI under a “Conversation” or similar category.

#### Metrics (conversation evaluation)

We will use a curated set of metrics for conversation agents, grouped into deterministic and judge/jury metrics.

- **Deterministic metrics (rules / exact checks)**
  - `format_valid` (boolean)
    - Response obeys the required output format (e.g., JSON, tool schema).
  - `tool_success_rate` (0–1)
    - Fraction of samples where tools are used correctly (arguments, timing).
  - `response_length_tokens` (numeric)
    - Length of responses, useful for verbosity and cost monitoring.
  - `latency_ms` or `roundtrip_time` (numeric, optional)
    - Time taken to produce responses.
  - `exact_match` / `slot_accuracy` (0–1, when applicable)
    - For structured or slot-filling tasks with a known correct answer.

- **Judge/jury metrics (LLM-as-judge)**
  - `helpfulness_score` (1–5 or 0–10)
    - How well the assistant answered the user’s request.
  - `instruction_following_score` (1–5)
    - Adherence to explicit instructions and constraints.
  - `relevance_score` (1–5)
    - On-topic and contextually appropriate responses.
  - `coherence_score` (1–5)
    - Logical consistency and clarity of responses.
  - `safety_score` (1–5, higher = safer)
    - Degree to which responses avoid harmful or disallowed content.
  - `faithfulness_score` (1–5)
    - Faithfulness to provided context (for grounded QA).
  - `grounding_violations_rate` (0–1)
    - Fraction of responses judged as hallucinated or ungrounded.
  - `persona_consistency_score` (1–5, optional)
    - Consistency with a specified persona or style over turns.
  - `overall_judge_score` (headline metric)
    - A composite score (either a dedicated judge question or a weighted aggregate) that we use as:
      - the `primary_metric` for `Conversation Core v1`,
      - the value displayed in leaderboards and run summaries for conversation packs.

Judge/jury metrics will be produced by LightEval judge metrics and/or custom plugins that read `EVALUATOR_SCORING_MODE` and `EVALUATOR_SCORING_CONFIG`.

### Consequences

- (+) We have a clear, shared vocabulary:
  - **Benchmark** = the definition of an evaluation (task).
  - **Pack** = a curated set of benchmarks and a scoring policy.
  - **Run** = a model evaluated on a pack.
  - **Metric** = how we score runs and benchmarks.
- (+) Conversation-specific packs and metrics become first-class citizens:
  - easy to present in leaderboards,
  - easy to compare models and scoring modes.
- (+) The curated metric set balances deterministic checks (e.g., tool success) with rich judge-based evaluations (helpfulness, safety, faithfulness).
- (-) Implementing the actual LightEval tasks and judge plugins for these benchmarks requires additional work (prompt design, calibration, and testing).
- (-) We must maintain consistency between:
  - metric names in LightEval task configs,
  - metric names used in packs and leaderboards,
  - and any composite scores (e.g., `overall_judge_score`).

