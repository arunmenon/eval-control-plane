"""
Conversation Core v1 custom task metadata for LightEval.

This module documents how the Conversation Core v1 benchmarks
(`conv_router_intent`, `conv_tool_routing`, `conv_helpfulness_core`)
relate to the multi_turn_traces_eval.jsonl dataset from the
reasoning-model-trainer repository.

In a future iteration, this module will be extended into a full
LightEval custom tasks plugin (with LightevalTaskConfig entries,
prompt functions returning Doc(...), and metric definitions).
For now, it exposes structured metadata that a runner or future
plugin can consume.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List


ROOT = Path(__file__).resolve().parents[3]
MULTI_TURN_TRACES_PATH = ROOT / "reasoning-model-trainer" / "examples" / "multi_turn_traces_eval.jsonl"


@dataclass
class ConversationTaskMeta:
    """Lightweight metadata for a conversation evaluation task."""

    task_name: str
    description: str
    dataset_path: Path
    primary_metrics: List[str]
    scoring_mode: str  # deterministic | judge


CONVERSATION_TASKS: List[ConversationTaskMeta] = [
    ConversationTaskMeta(
        task_name="conv_router_intent",
        description="Conversation intent routing accuracy over multi_turn_traces_eval.",
        dataset_path=MULTI_TURN_TRACES_PATH,
        primary_metrics=["intent_accuracy", "decision_accuracy"],
        scoring_mode="deterministic",
    ),
    ConversationTaskMeta(
        task_name="conv_tool_routing",
        description="Conversation tool routing and call structure quality.",
        dataset_path=MULTI_TURN_TRACES_PATH,
        primary_metrics=["tool_success_rate", "format_valid"],
        scoring_mode="deterministic",
    ),
    ConversationTaskMeta(
        task_name="conv_helpfulness_core",
        description="Judge-based conversation helpfulness and overall quality.",
        dataset_path=MULTI_TURN_TRACES_PATH,
        primary_metrics=["overall_judge_score"],
        scoring_mode="judge",
    ),
]


def get_conversation_task(task_name: str) -> ConversationTaskMeta | None:
    """Return metadata for a conversation task by name."""
    for meta in CONVERSATION_TASKS:
        if meta.task_name == task_name:
            return meta
    return None


__all__ = [
    "MULTI_TURN_TRACES_PATH",
    "ConversationTaskMeta",
    "CONVERSATION_TASKS",
    "get_conversation_task",
]

