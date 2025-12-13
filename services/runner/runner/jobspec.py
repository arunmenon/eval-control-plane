from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BackendConfig(BaseModel):
  type: str
  model_name: str
  provider: Optional[str] = None
  base_url: Optional[str] = None
  parallel_calls_count: Optional[int] = Field(default=None, gt=0)


class GenerationConfig(BaseModel):
  temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
  max_new_tokens: Optional[int] = Field(default=None, gt=0)
  top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class TaskEntry(BaseModel):
  id: str
  fewshot: int = Field(ge=0)
  params: Optional[Dict[str, Any]] = None


class CustomPlugin(BaseModel):
  name: str
  version: str


class ArtifactsConfig(BaseModel):
  output_dir: str
  save_details: bool = False


class JudgeEntry(BaseModel):
  judge_model_name: str
  judge_backend: str
  weight: Optional[float] = None
  max_tokens: Optional[int] = Field(default=None, gt=0)
  judge_template_id: Optional[str] = None


class ScoringConfig(BaseModel):
  judge_template_id: Optional[str] = None
  judges: Optional[List[JudgeEntry]] = None
  aggregation: Optional[str] = None
  report_disagreement: Optional[bool] = None


class JobSpec(BaseModel):
  jobspec_version: str = "1"
  benchmark_pack_id: str
  run_name: Optional[str] = None
  max_samples: Optional[int] = Field(default=None, gt=0)
  num_fewshot_seeds: int = Field(default=1, gt=0)
  backend: BackendConfig
  generation: Optional[GenerationConfig] = None
  tasks: List[TaskEntry]
  custom_plugins: Optional[List[CustomPlugin]] = None
  artifacts: ArtifactsConfig
  scoring_mode: Optional[str] = Field(default=None)
  scoring_config: Optional[ScoringConfig] = None
