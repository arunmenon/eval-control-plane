import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

import { prisma } from "./prisma";
import type { JobSpec } from "./schemas/jobspec";

async function findFilesWithExtension(rootDir: string, ext: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // eslint-disable-next-line no-await-in-loop
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return results;
}

async function ingestResults(runId: string, jobSpec: JobSpec): Promise<void> {
  const outputDir = jobSpec.artifacts.output_dir;

  const jsonFiles = await findFilesWithExtension(outputDir, ".json");
  const resultFiles = jsonFiles.filter((filePath) => path.basename(filePath).startsWith("results_"));

  if (resultFiles.length === 0) {
    return;
  }

  // For now, take the first results file we find.
  const resultsPath = resultFiles[0];
  const raw = await fs.readFile(resultsPath, "utf8");
  const payload = JSON.parse(raw);

  const configGeneral = payload.config_general ?? {};
  const results = payload.results ?? {};
  const summaryTasks = payload.summary_tasks ?? {};

  // Detect details base URI if any parquet file exists.
  let detailsBaseUri: string | null = null;
  const parquetFiles = await findFilesWithExtension(outputDir, ".parquet");
  if (parquetFiles.length > 0) {
    detailsBaseUri = path.join(outputDir, "details");
  }

  const resultsJsonString = JSON.stringify(payload);

  await prisma.runArtifacts.upsert({
    where: { run_id: runId },
    update: {
      results_json_uri: resultsPath,
      details_base_uri: detailsBaseUri,
      logs_uri: null,
      results_json: resultsJsonString,
      lighteval_sha: configGeneral.lighteval_sha ?? null,
      model_sha: configGeneral.model_sha ?? null,
      total_eval_seconds: configGeneral.total_evaluation_time_secondes ?? null,
    },
    create: {
      run_id: runId,
      results_json_uri: resultsPath,
      details_base_uri: detailsBaseUri,
      logs_uri: null,
      results_json: resultsJsonString,
      lighteval_sha: configGeneral.lighteval_sha ?? null,
      model_sha: configGeneral.model_sha ?? null,
      total_eval_seconds: configGeneral.total_evaluation_time_secondes ?? null,
    },
  });

  const metricRows: { run_id: string; task_key: string; metric_name: string; metric_value: number | null }[] = [];

  for (const [taskKey, metrics] of Object.entries(results)) {
    if (typeof metrics !== "object" || metrics === null) continue;
    for (const [metricName, metricValue] of Object.entries(metrics as Record<string, unknown>)) {
      if (typeof metricValue === "number") {
        metricRows.push({
          run_id: runId,
          task_key: taskKey,
          metric_name: metricName,
          metric_value: metricValue,
        });
      }
    }
  }

  if (metricRows.length > 0) {
    // Idempotent ingestion: clear any existing metrics for this run before inserting.
    await prisma.runTaskMetric.deleteMany({
      where: { run_id: runId },
    });
    await prisma.runTaskMetric.createMany({
      data: metricRows,
    });
  }

  const hashRows: {
    run_id: string;
    task_key: string;
    hash_examples: string | null;
    hash_full_prompts: string | null;
    hash_input_tokens: string | null;
    hash_cont_tokens: string | null;
  }[] = [];

  for (const [taskKey, summary] of Object.entries(summaryTasks)) {
    const hashes = (summary as any).hashes;
    if (!hashes) continue;
    hashRows.push({
      run_id: runId,
      task_key: taskKey,
      hash_examples: hashes.hash_examples ?? null,
      hash_full_prompts: hashes.hash_full_prompts ?? null,
      hash_input_tokens: hashes.hash_input_tokens ?? null,
      hash_cont_tokens: hashes.hash_cont_tokens ?? null,
    });
  }

  if (hashRows.length > 0) {
    // Idempotent ingestion: clear any existing hashes for this run before inserting.
    await prisma.runTaskHash.deleteMany({
      where: { run_id: runId },
    });
    await prisma.runTaskHash.createMany({
      data: hashRows,
    });
  }

  // Compute pack-level score using pack.primary_metric and pack tasks.
  const runWithPack = await prisma.run.findUnique({
    where: { run_id: runId },
    include: { pack: { include: { packTasks: true } } },
  });

  let packScore: number | null = null;
  if (runWithPack?.pack) {
    const primaryMetric = runWithPack.pack.primary_metric;
    const tasksForPack = runWithPack.pack.packTasks;

    let weightedSum = 0;
    let weightTotal = 0;

    for (const packTask of tasksForPack) {
      const taskKey = packTask.task_spec;
      const taskMetrics = results[taskKey];
      if (!taskMetrics || typeof taskMetrics !== "object") continue;
      const value = (taskMetrics as any)[primaryMetric];
      if (typeof value !== "number") continue;
      weightedSum += value * packTask.weight;
      weightTotal += packTask.weight;
    }

    if (weightTotal > 0) {
      packScore = weightedSum / weightTotal;
    }
  }

  await prisma.runScores.upsert({
    where: { run_id: runId },
    update: {
      pack_score: packScore,
      pack_score_stderr: null,
      all_metrics: JSON.stringify(results.all ?? {}),
    },
    create: {
      run_id: runId,
      pack_score: packScore,
      pack_score_stderr: null,
      all_metrics: JSON.stringify(results.all ?? {}),
    },
  });

  // Track details parquet files per task.
  if (parquetFiles.length > 0) {
    const detailRows: {
      run_id: string;
      task_key: string;
      parquet_uri: string;
      num_rows: number | null;
    }[] = [];

    for (const parquetPath of parquetFiles) {
      const filename = path.basename(parquetPath);
      if (!filename.startsWith("details_") || !filename.endsWith(".parquet")) {
        continue;
      }
      const withoutPrefix = filename.slice("details_".length, -".parquet".length);
      const parts = withoutPrefix.split("_");
      const taskKey = parts.length > 1 ? parts.slice(0, -1).join("_") : withoutPrefix;

      detailRows.push({
        run_id: runId,
        task_key: taskKey,
        parquet_uri: parquetPath,
        num_rows: null,
      });
    }

    if (detailRows.length > 0) {
      // Idempotent ingestion: clear any existing detail file rows for this run before inserting.
      await prisma.runDetailFile.deleteMany({
        where: { run_id: runId },
      });
      await prisma.runDetailFile.createMany({
        data: detailRows,
      });
    }
  }
}

function normalizeTaskSpec(id: string, fewshot: number): string {
  // If the id already ends with "|<int>", trust it as a fully formed LightEval task key.
  if (/\|\d+$/.test(id)) {
    return id;
  }
  return `${id}|${fewshot}`;
}

export async function runLightEvalForRun(runId: string, jobSpec: JobSpec): Promise<void> {
  const startedAt = new Date();
  await prisma.run.update({
    where: { run_id: runId },
    data: { status: "running", started_at: startedAt },
  });

  // Resolve any judge/jury plugins associated with the pack tasks via overrides.
  const runRecord = await prisma.run.findUnique({
    where: { run_id: runId },
    include: {
      pack: {
        include: {
          packTasks: true,
        },
      },
    },
  });

  const pluginPaths = new Set<string>();
  if (runRecord?.pack) {
    for (const packTask of runRecord.pack.packTasks) {
      let overrides: any = {};
      if (packTask.overrides) {
        try {
          overrides = JSON.parse(packTask.overrides);
        } catch {
          overrides = {};
        }
      }
      const pluginName = overrides?.judge_plugin_name as string | undefined;
      const pluginVersion = overrides?.judge_plugin_version as string | undefined;
      if (pluginName && pluginVersion) {
        // eslint-disable-next-line no-await-in-loop
        const plugin = await prisma.plugin.findFirst({
          where: { name: pluginName, version: pluginVersion },
        });
        if (plugin) {
          pluginPaths.add(plugin.storage_uri);
        }
      }
    }
  }

  const tasksArg = jobSpec.tasks.map((t) => normalizeTaskSpec(t.id, t.fewshot)).join(",");

  const args: string[] = [
    "eval",
    "--model",
    jobSpec.backend.model_name,
    "--tasks",
    tasksArg,
    "--output-dir",
    jobSpec.artifacts.output_dir,
  ];

  if (jobSpec.max_samples) {
    args.push("--max-samples", String(jobSpec.max_samples));
  }
  if (jobSpec.artifacts.save_details) {
    args.push("--save-details");
  }

  // Attach any judge/jury plugin paths as custom tasks.
  for (const pluginPath of pluginPaths) {
    args.push("--custom-tasks", pluginPath);
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    EVALUATOR_SCORING_MODE: jobSpec.scoring_mode ?? "deterministic",
  };
  if (jobSpec.scoring_config) {
    env.EVALUATOR_SCORING_CONFIG = JSON.stringify(jobSpec.scoring_config);
  }

  const child = spawn("lighteval", args, {
    stdio: "inherit",
    env,
  });

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on("error", (err) => reject(err));
    child.on("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    await prisma.run.update({
      where: { run_id: runId },
      data: { status: "failed", finished_at: new Date() },
    });
    return;
  }

  await ingestResults(runId, jobSpec);

  await prisma.run.update({
    where: { run_id: runId },
    data: { status: "completed", finished_at: new Date() },
  });
}
