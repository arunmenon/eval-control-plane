## ADR-0012: Judge/jury task plugins and pack mapping

**Status:** Accepted

### Context

ADR-0006 defines explicit scoring modes (`deterministic`, `judge`, `jury`) and ADR-0011 defines how `scoring_mode` and `scoring_config` are propagated to LightEval via environment variables.
However, LightEval itself evaluates models through tasks and metrics, which must understand how to interpret judge/jury configuration.
We need a consistent way to:

- package judge/jury-aware tasks and metrics as plugins,
- reference those plugins from benchmark packs,
- and allow judge/jury behavior to evolve without changing the core runner.

### Decision

We will represent judge/jury evaluation logic as LightEval task/metric plugins and connect them to packs via explicit mapping:

- **Judge/jury plugins**
  - Judge/jury behavior (e.g., LLM-as-judge scoring, jury aggregation, disagreement reporting) is implemented in one or more Python plugins that LightEval can load via `--custom-tasks` or `custom_tasks_directory`.
  - These plugins:
    - read `EVALUATOR_SCORING_MODE` and `EVALUATOR_SCORING_CONFIG` from the environment (as defined in ADR-0011),
    - select judge backends/models and templates accordingly,
    - compute judge-based metrics and, for juries, disagreement metrics.
  - Each plugin bundle is registered in the `plugins` table with `plugin_type = "task"` or `"bundle"` and a `storage_uri` pointing to the code artifact (e.g., Git ref or package path).

- **Pack mapping**
  - `PackTask.overrides` will be used to bind a pack task to a judge/jury plugin and profile when needed.
  - For judge/jury tasks, `overrides` may include keys such as:
    - `judge_plugin_name` / `judge_plugin_version` (referencing a row in `plugins`),
    - `judge_profile` (logical profile name within the plugin),
    - `judge_template_id` (optional reference to a template in `judge_templates`).
  - When the runner builds a job for a pack:
    - it resolves any `judge_plugin_*` overrides on `PackTask` into concrete plugin paths,
    - ensures these plugins are available to LightEval (e.g., via `--custom-tasks` or `custom_tasks_directory`),
    - leaves the actual scoring behavior to the plugin, which consumes `EVALUATOR_SCORING_*`.

- **Built-in judge tasks**
  - For judge/jury benchmarks that are already provided by LightEval as built-in tasks, packs can simply use the built-in task name in `task_spec` with no plugin override.
  - In this case, LightEval’s built-in judge metrics interpret `scoring_mode`/`scoring_config` as needed, or fall back to their own configuration if they do not read our environment variables.

### Consequences

- (+) Judge/jury behavior is encapsulated in plugins:
  - Changes to judge prompts, aggregation, or disagreement metrics are made in plugin code, not in the core runner or API.
- (+) Packs declaratively bind to judge/jury behavior:
  - Either by referencing built-in LightEval judge tasks,
  - Or by specifying a plugin + profile via `PackTask.overrides`.
- (+) Multiple judge/jury profiles can coexist:
  - e.g., a “conservative” profile and a “strict” profile, selected per pack or task.
- (-) Requires a plugin packaging and deployment workflow for judge/jury code.
- (-) Requires coordination between pack authors and plugin authors to ensure overrides and plugin profiles stay in sync.
