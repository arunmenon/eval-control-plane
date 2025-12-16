import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Benchmarks (Reasoning)
  const gsm8k = await prisma.benchmark.upsert({
    where: { benchmark_key: "gsm8k|0" },
    update: {},
    create: {
      benchmark_key: "gsm8k|0",
      suite: "demo",
      task_name: "gsm8k",
      source_type: "seed_demo",
      scoring_mode: "deterministic",
      tags: JSON.stringify(["math", "reasoning"]),
      description: "Grade-school math word problems (demo seed).",
      hf_repo: "gsm8k",
      hf_subset: "main",
      evaluation_splits: JSON.stringify(["test"]),
      hf_revision: "demo",
      default_fewshot: 0,
    },
  });

  const truthfulqa = await prisma.benchmark.upsert({
    where: { benchmark_key: "truthfulqa:mc|0" },
    update: {},
    create: {
      benchmark_key: "truthfulqa:mc|0",
      suite: "demo",
      task_name: "truthfulqa:mc",
      source_type: "seed_demo",
      scoring_mode: "deterministic",
      tags: JSON.stringify(["truthfulness", "safety"]),
      description: "TruthfulQA multiple-choice (demo seed).",
      hf_repo: "truthfulqa",
      hf_subset: "mc",
      evaluation_splits: JSON.stringify(["validation"]),
      hf_revision: "demo",
      default_fewshot: 0,
    },
  });

  // Pack
  const pack = await prisma.pack.upsert({
    where: { name_version: { name: "Reasoning Core v1", version: "1.0" } },
    update: {},
    create: {
      name: "Reasoning Core v1",
      version: "1.0",
      description: "Demo pack combining math and truthfulness benchmarks.",
      primary_metric: "em",
      aggregation: "mean",
      tags: JSON.stringify(["demo", "reasoning"]),
    },
  });

  // Pack tasks
  await prisma.packTask.upsert({
    where: { pack_id_task_spec: { pack_id: pack.pack_id, task_spec: "gsm8k|0" } },
    update: {},
    create: {
      pack_id: pack.pack_id,
      benchmark_id: gsm8k.benchmark_id,
      task_spec: "gsm8k|0",
      fewshot: 0,
      weight: 1.0,
      display_order: 0,
      overrides: "{}",
    },
  });

  await prisma.packTask.upsert({
    where: { pack_id_task_spec: { pack_id: pack.pack_id, task_spec: "truthfulqa:mc|0" } },
    update: {},
    create: {
      pack_id: pack.pack_id,
      benchmark_id: truthfulqa.benchmark_id,
      task_spec: "truthfulqa:mc|0",
      fewshot: 0,
      weight: 1.0,
      display_order: 1,
      overrides: "{}",
    },
  });

  // Runs
  const run1 = await prisma.run.upsert({
    where: { run_id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      run_id: "00000000-0000-0000-0000-000000000001",
      pack_id: pack.pack_id,
      run_name: "Reasoning Core v1 – demo-model-a",
      status: "completed",
      model_name: "demo-model-a",
      requested_model_name: "demo-model-a",
      backend_type: "endpoint_demo",
      backend_config: JSON.stringify({}),
      max_samples: 100,
      num_fewshot_seeds: 1,
      save_details: false,
      output_dir: "/tmp/evaluator-demo/run1",
      results_path_template: null,
      scoring_mode: "deterministic",
      scoring_config: "{}",
      generation_config: JSON.stringify({ temperature: 0 }),
      tags: JSON.stringify(["demo"]),
      notes: "Seed demo run (completed).",
    },
  });

  const run2 = await prisma.run.upsert({
    where: { run_id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      run_id: "00000000-0000-0000-0000-000000000002",
      pack_id: pack.pack_id,
      run_name: "Reasoning Core v1 – demo-model-b (judge)",
      status: "completed",
      model_name: "demo-model-b",
      requested_model_name: "demo-model-b",
      backend_type: "endpoint_demo",
      backend_config: JSON.stringify({}),
      max_samples: 100,
      num_fewshot_seeds: 1,
      save_details: false,
      output_dir: "/tmp/evaluator-demo/run2",
      results_path_template: null,
      scoring_mode: "judge",
      scoring_config: JSON.stringify({
        aggregation: "mean",
        report_disagreement: true,
      }),
      generation_config: JSON.stringify({ temperature: 0 }),
      tags: JSON.stringify(["demo"]),
      notes: "Seed demo run (judge-based).",
    },
  });

  const run3 = await prisma.run.upsert({
    where: { run_id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      run_id: "00000000-0000-0000-0000-000000000003",
      pack_id: pack.pack_id,
      run_name: "Reasoning Core v1 – demo-model-c (running)",
      status: "running",
      model_name: "demo-model-c",
      requested_model_name: "demo-model-c",
      backend_type: "endpoint_demo",
      backend_config: JSON.stringify({}),
      max_samples: 100,
      num_fewshot_seeds: 1,
      save_details: false,
      output_dir: "/tmp/evaluator-demo/run3",
      results_path_template: null,
      scoring_mode: "jury",
      scoring_config: JSON.stringify({
        aggregation: "mean",
        report_disagreement: true,
      }),
      generation_config: JSON.stringify({ temperature: 0 }),
      tags: JSON.stringify(["demo"]),
      notes: "Seed demo run (jury, in progress).",
    },
  });

  // Scores
  await prisma.runScores.upsert({
    where: { run_id: run1.run_id },
    update: {},
    create: {
      run_id: run1.run_id,
      pack_score: 0.72,
      pack_score_stderr: 0.02,
      all_metrics: JSON.stringify({ em: 0.72 }),
    },
  });

  await prisma.runScores.upsert({
    where: { run_id: run2.run_id },
    update: {},
    create: {
      run_id: run2.run_id,
      pack_score: 0.76,
      pack_score_stderr: 0.03,
      all_metrics: JSON.stringify({ em: 0.76 }),
    },
  });

  // Task metrics for run1
  await prisma.runTaskMetric.deleteMany({
    where: { run_id: run1.run_id },
  });
  await prisma.runTaskMetric.createMany({
    data: [
      {
        run_id: run1.run_id,
        task_key: "gsm8k|0",
        metric_name: "em",
        metric_value: 0.78,
      },
      {
        run_id: run1.run_id,
        task_key: "truthfulqa:mc|0",
        metric_name: "em",
        metric_value: 0.66,
      },
    ],
  });

  // Task metrics for run2
  await prisma.runTaskMetric.deleteMany({
    where: { run_id: run2.run_id },
  });
  await prisma.runTaskMetric.createMany({
    data: [
      {
        run_id: run2.run_id,
        task_key: "gsm8k|0",
        metric_name: "em",
        metric_value: 0.80,
      },
      {
        run_id: run2.run_id,
        task_key: "truthfulqa:mc|0",
        metric_name: "em",
        metric_value: 0.72,
      },
    ],
  });

  // No metrics for run3 (still running).

  // ---------------------------------------------------------------------------
  // Conversation Core v1 pack and benchmarks (demo seed)
  // ---------------------------------------------------------------------------

  const convRouter = await prisma.benchmark.upsert({
    where: { benchmark_key: "conv_router_intent" },
    update: {},
    create: {
      benchmark_key: "conv_router_intent",
      suite: "conversation",
      task_name: "conv_router_intent",
      source_type: "conversation_seed",
      scoring_mode: "deterministic",
      tags: JSON.stringify(["conversation", "routing"]),
      description: "Conversation intent routing accuracy (demo seed).",
      hf_repo: "local:multi_turn_traces_eval",
      hf_subset: "default",
      evaluation_splits: JSON.stringify(["eval"]),
      hf_revision: "v1",
      default_fewshot: 0,
    },
  });

  const convTools = await prisma.benchmark.upsert({
    where: { benchmark_key: "conv_tool_routing" },
    update: {},
    create: {
      benchmark_key: "conv_tool_routing",
      suite: "conversation",
      task_name: "conv_tool_routing",
      source_type: "conversation_seed",
      scoring_mode: "deterministic",
      tags: JSON.stringify(["conversation", "tools"]),
      description: "Conversation tool routing and call structure (demo seed).",
      hf_repo: "local:multi_turn_traces_eval",
      hf_subset: "default",
      evaluation_splits: JSON.stringify(["eval"]),
      hf_revision: "v1",
      default_fewshot: 0,
    },
  });

  const convHelpfulness = await prisma.benchmark.upsert({
    where: { benchmark_key: "conv_helpfulness_core" },
    update: {},
    create: {
      benchmark_key: "conv_helpfulness_core",
      suite: "conversation",
      task_name: "conv_helpfulness_core",
      source_type: "conversation_seed",
      scoring_mode: "judge",
      tags: JSON.stringify(["conversation", "helpfulness"]),
      description: "Judge-based conversation helpfulness and overall quality (demo seed).",
      hf_repo: "local:multi_turn_traces_eval",
      hf_subset: "default",
      evaluation_splits: JSON.stringify(["eval"]),
      hf_revision: "v1",
      default_fewshot: 0,
    },
  });

  const convPack = await prisma.pack.upsert({
    where: { name_version: { name: "Conversation Core v1", version: "1.0" } },
    update: {},
    create: {
      name: "Conversation Core v1",
      version: "1.0",
      description: "Conversation agents core evaluation: routing, tools, and helpfulness.",
      primary_metric: "overall_judge_score",
      aggregation: "mean",
      tags: JSON.stringify(["conversation", "core"]),
    },
  });

  await prisma.packTask.upsert({
    where: { pack_id_task_spec: { pack_id: convPack.pack_id, task_spec: "conv_router_intent" } },
    update: {},
    create: {
      pack_id: convPack.pack_id,
      benchmark_id: convRouter.benchmark_id,
      task_spec: "conv_router_intent",
      fewshot: 0,
      weight: 1.0,
      display_order: 0,
      overrides: JSON.stringify({
        dataset_path: "../reasoning-model-trainer/examples/multi_turn_traces_eval.jsonl",
      }),
    },
  });

  await prisma.packTask.upsert({
    where: { pack_id_task_spec: { pack_id: convPack.pack_id, task_spec: "conv_tool_routing" } },
    update: {},
    create: {
      pack_id: convPack.pack_id,
      benchmark_id: convTools.benchmark_id,
      task_spec: "conv_tool_routing",
      fewshot: 0,
      weight: 1.0,
      display_order: 1,
      overrides: JSON.stringify({
        dataset_path: "../reasoning-model-trainer/examples/multi_turn_traces_eval.jsonl",
      }),
    },
  });

  await prisma.packTask.upsert({
    where: { pack_id_task_spec: { pack_id: convPack.pack_id, task_spec: "conv_helpfulness_core" } },
    update: {},
    create: {
      pack_id: convPack.pack_id,
      benchmark_id: convHelpfulness.benchmark_id,
      task_spec: "conv_helpfulness_core",
      fewshot: 0,
      weight: 1.0,
      display_order: 2,
      overrides: JSON.stringify({
        dataset_path: "../reasoning-model-trainer/examples/multi_turn_traces_eval.jsonl",
      }),
    },
  });

  const convRun1 = await prisma.run.upsert({
    where: { run_id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      run_id: "00000000-0000-0000-0000-000000000101",
      pack_id: convPack.pack_id,
      run_name: "Conversation Core v1 – conv-model-a",
      status: "completed",
      model_name: "demo-conv-model-a",
      requested_model_name: "demo-conv-model-a",
      backend_type: "endpoint_demo",
      backend_config: JSON.stringify({}),
      max_samples: 100,
      num_fewshot_seeds: 1,
      save_details: false,
      output_dir: "/tmp/evaluator-demo/conv-run1",
      results_path_template: null,
      scoring_mode: "judge",
      scoring_config: JSON.stringify({
        aggregation: "mean",
        report_disagreement: true,
      }),
      generation_config: JSON.stringify({ temperature: 0 }),
      tags: JSON.stringify(["demo", "conversation"]),
      notes: "Seed demo conversation run (conv-model-a).",
    },
  });

  const convRun2 = await prisma.run.upsert({
    where: { run_id: "00000000-0000-0000-0000-000000000102" },
    update: {},
    create: {
      run_id: "00000000-0000-0000-0000-000000000102",
      pack_id: convPack.pack_id,
      run_name: "Conversation Core v1 – conv-model-b",
      status: "completed",
      model_name: "demo-conv-model-b",
      requested_model_name: "demo-conv-model-b",
      backend_type: "endpoint_demo",
      backend_config: JSON.stringify({}),
      max_samples: 100,
      num_fewshot_seeds: 1,
      save_details: false,
      output_dir: "/tmp/evaluator-demo/conv-run2",
      results_path_template: null,
      scoring_mode: "judge",
      scoring_config: JSON.stringify({
        aggregation: "mean",
        report_disagreement: true,
      }),
      generation_config: JSON.stringify({ temperature: 0 }),
      tags: JSON.stringify(["demo", "conversation"]),
      notes: "Seed demo conversation run (conv-model-b).",
    },
  });

  await prisma.runScores.upsert({
    where: { run_id: convRun1.run_id },
    update: {},
    create: {
      run_id: convRun1.run_id,
      pack_score: 0.78,
      pack_score_stderr: 0.03,
      all_metrics: JSON.stringify({ overall_judge_score: 0.78 }),
    },
  });

  await prisma.runScores.upsert({
    where: { run_id: convRun2.run_id },
    update: {},
    create: {
      run_id: convRun2.run_id,
      pack_score: 0.82,
      pack_score_stderr: 0.02,
      all_metrics: JSON.stringify({ overall_judge_score: 0.82 }),
    },
  });

  await prisma.runTaskMetric.deleteMany({
    where: { run_id: { in: [convRun1.run_id, convRun2.run_id] } },
  });

  await prisma.runTaskMetric.createMany({
    data: [
      // convRun1 metrics
      {
        run_id: convRun1.run_id,
        task_key: "conv_router_intent",
        metric_name: "intent_accuracy",
        metric_value: 0.8,
      },
      {
        run_id: convRun1.run_id,
        task_key: "conv_tool_routing",
        metric_name: "tool_success_rate",
        metric_value: 0.75,
      },
      {
        run_id: convRun1.run_id,
        task_key: "conv_helpfulness_core",
        metric_name: "overall_judge_score",
        metric_value: 0.78,
      },
      // convRun2 metrics
      {
        run_id: convRun2.run_id,
        task_key: "conv_router_intent",
        metric_name: "intent_accuracy",
        metric_value: 0.85,
      },
      {
        run_id: convRun2.run_id,
        task_key: "conv_tool_routing",
        metric_name: "tool_success_rate",
        metric_value: 0.78,
      },
      {
        run_id: convRun2.run_id,
        task_key: "conv_helpfulness_core",
        metric_name: "overall_judge_score",
        metric_value: 0.82,
      },
    ],
  });
}

main()
  .then(async () => {
    // eslint-disable-next-line no-console
    console.log("Demo seed data applied.");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error("Failed to seed demo data", e);
    await prisma.$disconnect();
    process.exit(1);
  });
