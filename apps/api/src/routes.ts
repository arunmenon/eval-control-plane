import type { FastifyInstance } from "fastify";
import { JobSpecSchema } from "./schemas/jobspec";
import { prisma } from "./prisma";
import { runLightEvalForRun } from "./lightevalRunner";
import { readParquetRows } from "./parquetReader";
import { inspectLightevalTask } from "./lightevalTasks";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/api/benchmarks", async (request) => {
    const query = request.query as { q?: string; suite?: string; scoringMode?: string };

    const benchmarks = await prisma.benchmark.findMany({
      where: {
        benchmark_key: query.q
          ? {
              contains: query.q,
            }
          : undefined,
        suite: query.suite,
        scoring_mode: query.scoringMode,
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    return { benchmarks };
  });

  app.get("/api/benchmarks/:benchmarkKey", async (request, reply) => {
    const params = request.params as { benchmarkKey: string };

    const benchmark = await prisma.benchmark.findUnique({
      where: { benchmark_key: params.benchmarkKey },
    });

    if (!benchmark) {
      reply.code(404);
      return { error: "Benchmark not found" };
    }

    return { benchmark };
  });

  app.get("/api/benchmarks/:benchmarkKey/inspect", async (request, reply) => {
    const params = request.params as { benchmarkKey: string };

    const benchmark = await prisma.benchmark.findUnique({
      where: { benchmark_key: params.benchmarkKey },
    });

    if (!benchmark) {
      reply.code(404);
      return { error: "Benchmark not found" };
    }

    try {
      const inspect = await inspectLightevalTask(benchmark.benchmark_key);
      return { benchmark, inspect };
    } catch (err) {
      // Fallback to DB snapshot if inspect fails.
      // eslint-disable-next-line no-console
      console.error("Failed to inspect LightEval task", err);
      return { benchmark, inspect: null };
    }
  });

  app.get("/api/packs", async () => {
    const packs = await prisma.pack.findMany({
      orderBy: { created_at: "desc" },
      include: {
        packTasks: true,
      },
    });

    const items = packs.map((p) => ({
      packId: p.pack_id,
      name: p.name,
      version: p.version,
      description: p.description,
      primaryMetric: p.primary_metric,
      aggregation: p.aggregation,
      tags: p.tags,
      taskCount: p.packTasks.length,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return { packs: items };
  });

  app.get("/api/packs/:packId", async (request, reply) => {
    const params = request.params as { packId: string };

    const pack = await prisma.pack.findUnique({
      where: { pack_id: params.packId },
      include: {
        packTasks: {
          include: {
            benchmark: true,
          },
        },
      },
    });

    if (!pack) {
      reply.code(404);
      return { error: "Pack not found" };
    }

    const tasks = pack.packTasks.map((pt) => ({
      packTaskId: pt.pack_task_id,
      taskSpec: pt.task_spec,
      fewshot: pt.fewshot,
      weight: pt.weight,
      displayOrder: pt.display_order,
      benchmark: {
        benchmarkId: pt.benchmark.benchmark_id,
        benchmarkKey: pt.benchmark.benchmark_key,
        taskName: pt.benchmark.task_name,
        suite: pt.benchmark.suite,
        scoringMode: pt.benchmark.scoring_mode,
      },
    }));

    return {
      pack: {
        packId: pack.pack_id,
        name: pack.name,
        version: pack.version,
        description: pack.description,
        primaryMetric: pack.primary_metric,
        aggregation: pack.aggregation,
        tags: pack.tags,
        createdAt: pack.created_at,
        updatedAt: pack.updated_at,
        tasks,
      },
    };
  });

  app.get("/api/runs", async (request) => {
    const query = request.query as { packId?: string; status?: string; scoringMode?: string };

    const runs = await prisma.run.findMany({
      where: {
        pack_id: query.packId,
        status: query.status,
        scoring_mode: query.scoringMode,
      },
      orderBy: { created_at: "desc" },
      take: 50,
      include: {
        scores: true,
      },
    });

    return { runs };
  });

  app.get("/api/runs/:runId", async (request, reply) => {
    const params = request.params as { runId: string };

    const run = await prisma.run.findUnique({
      where: { run_id: params.runId },
      include: {
        pack: true,
        artifacts: true,
        scores: true,
        taskMetrics: true,
        taskHashes: true,
        detailFiles: true,
      },
    });

    if (!run) {
      reply.code(404);
      return { error: "Run not found" };
    }

    return { run };
  });

  app.get("/api/leaderboards/:packId", async (request, reply) => {
    const params = request.params as { packId: string };
    const query = request.query as { scoringMode?: string };

    const pack = await prisma.pack.findUnique({
      where: { pack_id: params.packId },
    });

    if (!pack) {
      reply.code(404);
      return { error: "Pack not found" };
    }

    const runs = await prisma.run.findMany({
      where: {
        pack_id: params.packId,
        scoring_mode: query.scoringMode,
        scores: {
          isNot: null,
        },
      },
      include: {
        scores: true,
      },
    });

    const leaderboard = runs
      .filter((r) => r.scores?.pack_score !== null && r.scores?.pack_score !== undefined)
      .sort((a, b) => {
        const aScore = a.scores?.pack_score ?? 0;
        const bScore = b.scores?.pack_score ?? 0;
        return bScore - aScore;
      })
      .map((r, index) => ({
        rank: index + 1,
        runId: r.run_id,
        modelName: r.model_name,
        packScore: r.scores?.pack_score,
        packScoreStderr: r.scores?.pack_score_stderr,
        scoringMode: r.scoring_mode,
        backendType: r.backend_type,
        createdAt: r.created_at,
      }));

    return { packId: pack.pack_id, primaryMetric: pack.primary_metric, leaderboard };
  });

  app.get("/api/runs/:runId/tasks/:taskKey/details", async (request, reply) => {
    const params = request.params as { runId: string; taskKey: string };
    const query = request.query as { page?: string; pageSize?: string };

    const page = Math.max(parseInt(query.page ?? "1", 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(query.pageSize ?? "20", 10) || 20, 1), 100);
    const offset = (page - 1) * pageSize;

    const detailFile = await prisma.runDetailFile.findUnique({
      where: {
        run_id_task_key: {
          run_id: params.runId,
          task_key: params.taskKey,
        },
      },
    });

    if (!detailFile) {
      reply.code(404);
      return { error: "Details not found for this run and task" };
    }

    const rows = await readParquetRows(detailFile.parquet_uri, offset, pageSize);

    return {
      runId: params.runId,
      taskKey: params.taskKey,
      page,
      pageSize,
      rows,
      hasMore: rows.length === pageSize,
    };
  });

  app.get("/api/runs/compare", async (request, reply) => {
    const query = request.query as { runIdA?: string; runIdB?: string };
    const { runIdA, runIdB } = query;

    if (!runIdA || !runIdB) {
      reply.code(400);
      return { error: "runIdA and runIdB are required" };
    }

    const [runA, runB] = await Promise.all([
      prisma.run.findUnique({
        where: { run_id: runIdA },
        include: { scores: true, taskMetrics: true },
      }),
      prisma.run.findUnique({
        where: { run_id: runIdB },
        include: { scores: true, taskMetrics: true },
      }),
    ]);

    if (!runA || !runB) {
      reply.code(404);
      return { error: "One or both runs not found" };
    }

    return { runA, runB };
  });

  app.post("/api/runs", async (request, reply) => {
    const parseResult = JobSpecSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return { error: "Invalid JobSpec", details: parseResult.error.flatten() };
    }

    const jobSpec = parseResult.data;

    // Ensure the referenced pack exists.
    const pack = await prisma.pack.findUnique({
      where: { pack_id: jobSpec.benchmark_pack_id },
    });

    if (!pack) {
      reply.code(400);
      return { error: "Invalid benchmark_pack_id", details: "Pack not found" };
    }

    const backendType = jobSpec.backend.type;
    const requestedModelName = jobSpec.backend.model_name;

    const run = await prisma.run.create({
      data: {
        pack_id: pack.pack_id,
        run_name: jobSpec.run_name,
        status: "queued",
        model_name: requestedModelName,
        requested_model_name: requestedModelName,
        backend_type: backendType,
        backend_config: JSON.stringify(jobSpec.backend),
        max_samples: jobSpec.max_samples ?? null,
        num_fewshot_seeds: jobSpec.num_fewshot_seeds,
        save_details: jobSpec.artifacts.save_details,
        output_dir: jobSpec.artifacts.output_dir,
        results_path_template: null,
        scoring_mode: jobSpec.scoring_mode ?? "deterministic",
        scoring_config: jobSpec.scoring_config ? JSON.stringify(jobSpec.scoring_config) : "{}",
        generation_config: jobSpec.generation ? JSON.stringify(jobSpec.generation) : "{}",
        tags: "[]",
        notes: null,
      },
    });

    // Fire-and-forget LightEval execution in the background.
    // In a production setup this should use a proper job queue and dedicated workers.
    void runLightEvalForRun(run.run_id, jobSpec).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Error running LightEval for run", run.run_id, err);
    });

    reply.code(202);
    return { runId: run.run_id };
  });
}
