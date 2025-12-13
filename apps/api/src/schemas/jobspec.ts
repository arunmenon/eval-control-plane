import { z } from "zod";

const BackendSchema = z.object({
  type: z.string(),
  model_name: z.string(),
  provider: z.string().optional(),
  base_url: z.string().optional(),
  parallel_calls_count: z.number().int().positive().optional(),
});

const GenerationSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  max_new_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
});

const TaskEntrySchema = z.object({
  id: z.string(),
  fewshot: z.number().int().nonnegative(),
  params: z.record(z.any()).optional(),
});

const CustomPluginSchema = z.object({
  name: z.string(),
  version: z.string(),
});

const ArtifactsSchema = z.object({
  output_dir: z.string(),
  save_details: z.boolean().default(false),
});

const JudgeEntrySchema = z.object({
  judge_model_name: z.string(),
  judge_backend: z.string(),
  weight: z.number().optional(),
  max_tokens: z.number().int().positive().optional(),
  judge_template_id: z.string().optional(),
});

const ScoringConfigSchema = z.object({
  judge_template_id: z.string().optional(),
  judges: z.array(JudgeEntrySchema).optional(),
  aggregation: z.string().optional(),
  report_disagreement: z.boolean().optional(),
});

export const JobSpecSchema = z.object({
  jobspec_version: z.string().default("1"),
  benchmark_pack_id: z.string(),
  run_name: z.string().optional(),
  max_samples: z.number().int().positive().optional(),
  num_fewshot_seeds: z.number().int().positive().default(1),
  backend: BackendSchema,
  generation: GenerationSchema.optional(),
  tasks: z.array(TaskEntrySchema).nonempty(),
  custom_plugins: z.array(CustomPluginSchema).optional(),
  artifacts: ArtifactsSchema,
  scoring_mode: z.enum(["deterministic", "judge", "jury"]).optional(),
  scoring_config: ScoringConfigSchema.optional(),
});

export type JobSpec = z.infer<typeof JobSpecSchema>;
