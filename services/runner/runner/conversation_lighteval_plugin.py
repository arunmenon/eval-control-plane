from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from .conversation_tasks import CONVERSATION_TASKS, ConversationTaskMeta


@dataclass
class MetricConfig:
  name: str
  is_primary: bool = False


@dataclass
class TaskConfig:
  name: str
  dataset_path: str
  metrics: List[MetricConfig]
  scoring_mode: str


def _metric_names_for_task(meta: ConversationTaskMeta) -> List[str]:
  if meta.task_name == "conv_helpfulness_core":
    return [
      "helpfulness_score",
      "instruction_following_score",
      "safety_score",
      "overall_judge_score",
    ]
  return list(meta.primary_metrics)


def _build_task_config(meta: ConversationTaskMeta) -> TaskConfig:
  metric_names = _metric_names_for_task(meta)
  primary_metric = meta.primary_metrics[0] if meta.primary_metrics else None
  metrics = [
    MetricConfig(name=m, is_primary=(m == primary_metric)) for m in metric_names
  ]
  return TaskConfig(
    name=meta.task_name,
    dataset_path=str(meta.dataset_path),
    metrics=metrics,
    scoring_mode=meta.scoring_mode,
  )


TASKS_TABLE: Dict[str, TaskConfig] = {
  meta.task_name: _build_task_config(meta) for meta in CONVERSATION_TASKS
}


__all__ = [
  "MetricConfig",
  "TaskConfig",
  "TASKS_TABLE",
]

