import { prisma } from "./prisma";
import { inspectLightevalTask, listLightevalTasks } from "./lightevalTasks";

export async function ingestLightevalBenchmarks(): Promise<void> {
  const tasks = await listLightevalTasks();

  for (const task of tasks) {
    // eslint-disable-next-line no-await-in-loop
    const details = await inspectLightevalTask(task.name);
    const dataset = details?.config?.dataset;

    // Heuristic scoring_mode detection based on metrics.
    let scoringMode: "deterministic" | "judge" | "jury" = "deterministic";
    const metrics = details?.config?.metrics;
    if (Array.isArray(metrics)) {
      const serialized = JSON.stringify(metrics).toLowerCase();
      if (serialized.includes("jury")) {
        scoringMode = "jury";
      } else if (serialized.includes("judge")) {
        scoringMode = "judge";
      }
    }

    const benchmarkKey = task.name;
    const suite = task.suite ?? details?.suite ?? "lighteval";

    await prisma.benchmark.upsert({
      where: { benchmark_key: benchmarkKey },
      update: {
        suite,
        task_name: task.name,
        source_type: "lighteval_builtin",
        scoring_mode: scoringMode,
        description: details?.description ?? task.description ?? null,
        hf_repo: dataset?.hf_repo ?? null,
        hf_subset: dataset?.hf_subset ?? null,
        evaluation_splits: dataset?.evaluation_splits
          ? JSON.stringify(dataset.evaluation_splits)
          : JSON.stringify([]),
        hf_revision: dataset?.hf_revision ?? null,
        default_fewshot: details?.config?.default_fewshot ?? null,
      },
      create: {
        benchmark_key: benchmarkKey,
        suite,
        task_name: task.name,
        source_type: "lighteval_builtin",
        scoring_mode: scoringMode,
        tags: JSON.stringify([]),
        description: details?.description ?? task.description ?? null,
        hf_repo: dataset?.hf_repo ?? null,
        hf_subset: dataset?.hf_subset ?? null,
        evaluation_splits: dataset?.evaluation_splits
          ? JSON.stringify(dataset.evaluation_splits)
          : JSON.stringify([]),
        hf_revision: dataset?.hf_revision ?? null,
        default_fewshot: details?.config?.default_fewshot ?? null,
      },
    });
  }
}

if (require.main === module) {
  ingestLightevalBenchmarks()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("Ingested LightEval benchmarks");
      process.exit(0);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Failed to ingest LightEval benchmarks", err);
      process.exit(1);
    });
}
