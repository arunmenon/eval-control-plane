from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Optional

import typer

from .jobspec import JobSpec
from .lighteval_cli import build_lighteval_eval_command, format_command_for_logging

app = typer.Typer(help="LightEval-based evaluation runner service")


@app.command()
def run_job(jobspec_path: Path = typer.Argument(..., help="Path to a JobSpec JSON file")) -> None:
  """
  Run a single evaluation job defined by a JobSpec JSON file.

  This is a minimal CLI entrypoint intended to be called by a worker
  process or a scheduler. Mapping from JobSpec to LightEval pipelines
  will be implemented here.
  """
  with jobspec_path.open("r", encoding="utf-8") as f:
    data = json.load(f)
  job = JobSpec.model_validate(data)

  cmd, env = build_lighteval_eval_command(job)
  typer.echo(f"Running LightEval: {format_command_for_logging(cmd)}")

  result = subprocess.run(cmd, env=env)
  if result.returncode != 0:
    raise typer.Exit(code=result.returncode)


@app.command()
def version() -> None:
  """Print runner version information."""
  typer.echo("evaluator-runner 0.1.0")


if __name__ == "__main__":
  app()
