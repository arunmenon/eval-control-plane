from __future__ import annotations

import json
import os
import shlex
from typing import Dict, List, Tuple

from .jobspec import JobSpec


def build_lighteval_eval_command(job: JobSpec) -> Tuple[List[str], Dict[str, str]]:
  """
  Map a JobSpec into a lighteval eval CLI command and environment.

  This keeps the runner's CLI invocation logic in one place so it can
  be reused or swapped for a direct Python API integration later.
  """
  cmd: List[str] = ["lighteval", "eval"]
  env: Dict[str, str] = os.environ.copy()

  backend = job.backend

  cmd.extend(["--model", backend.model_name])
  if backend.provider:
    cmd.extend(["--provider", backend.provider])
  if backend.parallel_calls_count is not None:
    cmd.extend(["--num-workers", str(backend.parallel_calls_count)])

  if backend.base_url:
    if backend.provider == "openai_compatible":
      env["OPENAI_API_BASE"] = backend.base_url
    else:
      env["EVALUATOR_BACKEND_BASE_URL"] = backend.base_url

  if job.generation:
    gen = job.generation
    if gen.temperature is not None:
      env["EVALUATOR_TEMPERATURE"] = str(gen.temperature)
    if gen.max_new_tokens is not None:
      env["EVALUATOR_MAX_NEW_TOKENS"] = str(gen.max_new_tokens)
    if gen.top_p is not None:
      env["EVALUATOR_TOP_P"] = str(gen.top_p)

  for task in job.tasks:
    cmd.extend(["--task", task.id])
    if task.fewshot:
      cmd.extend(["--fewshot", str(task.fewshot)])
    if task.params:
      env_key = f"EVALUATOR_TASK_PARAMS__{task.id}"
      env[env_key] = json.dumps(task.params)

  if job.max_samples is not None:
    cmd.extend(["--max-samples", str(job.max_samples)])
  cmd.extend(["--num-fewshot-seeds", str(job.num_fewshot_seeds)])

  cmd.extend(["--output-dir", job.artifacts.output_dir])
  if job.artifacts.save_details:
    cmd.append("--save-details")

  if job.scoring_mode:
    env["EVALUATOR_SCORING_MODE"] = job.scoring_mode
  if job.scoring_config:
    env["EVALUATOR_SCORING_CONFIG"] = job.scoring_config.model_dump_json()

  if job.custom_plugins:
    for plugin in job.custom_plugins:
      cmd.extend(["--custom-tasks", plugin.name])

  env["EVALUATOR_BENCHMARK_PACK_ID"] = job.benchmark_pack_id
  if job.run_name:
    env["EVALUATOR_RUN_NAME"] = job.run_name

  return cmd, env


def format_command_for_logging(cmd: List[str]) -> str:
  """Return a shell-escaped command string for logging."""
  return " ".join(shlex.quote(part) for part in cmd)
