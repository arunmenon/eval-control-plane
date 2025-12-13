-- CreateTable
CREATE TABLE "Benchmark" (
    "benchmark_id" TEXT NOT NULL PRIMARY KEY,
    "benchmark_key" TEXT NOT NULL,
    "suite" TEXT NOT NULL,
    "task_name" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "scoring_mode" TEXT NOT NULL,
    "tags" TEXT,
    "description" TEXT,
    "hf_repo" TEXT,
    "hf_subset" TEXT,
    "evaluation_splits" TEXT,
    "hf_revision" TEXT,
    "default_fewshot" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pack" (
    "pack_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "primary_metric" TEXT NOT NULL,
    "aggregation" TEXT NOT NULL,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PackTask" (
    "pack_task_id" TEXT NOT NULL PRIMARY KEY,
    "pack_id" TEXT NOT NULL,
    "benchmark_id" TEXT NOT NULL,
    "task_spec" TEXT NOT NULL,
    "fewshot" INTEGER NOT NULL DEFAULT 0,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "overrides" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "PackTask_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "Pack" ("pack_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackTask_benchmark_id_fkey" FOREIGN KEY ("benchmark_id") REFERENCES "Benchmark" ("benchmark_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plugin" (
    "plugin_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "plugin_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "storage_uri" TEXT NOT NULL,
    "requirements_txt" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JudgeTemplate" (
    "template_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "prompt_template" TEXT NOT NULL,
    "response_schema" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Run" (
    "run_id" TEXT NOT NULL PRIMARY KEY,
    "pack_id" TEXT NOT NULL,
    "run_name" TEXT,
    "status" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "requested_model_name" TEXT NOT NULL,
    "backend_type" TEXT NOT NULL,
    "backend_config" TEXT NOT NULL DEFAULT '{}',
    "max_samples" INTEGER,
    "num_fewshot_seeds" INTEGER NOT NULL DEFAULT 1,
    "save_details" BOOLEAN NOT NULL DEFAULT false,
    "output_dir" TEXT NOT NULL,
    "results_path_template" TEXT,
    "scoring_mode" TEXT NOT NULL,
    "scoring_config" TEXT NOT NULL DEFAULT '{}',
    "generation_config" TEXT NOT NULL DEFAULT '{}',
    "tags" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" DATETIME,
    "finished_at" DATETIME,
    CONSTRAINT "Run_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "Pack" ("pack_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunArtifacts" (
    "run_id" TEXT NOT NULL PRIMARY KEY,
    "results_json_uri" TEXT NOT NULL,
    "details_base_uri" TEXT,
    "logs_uri" TEXT,
    "results_json" TEXT,
    "lighteval_sha" TEXT,
    "model_sha" TEXT,
    "total_eval_seconds" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunArtifacts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "Run" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunScores" (
    "run_id" TEXT NOT NULL PRIMARY KEY,
    "pack_score" REAL,
    "pack_score_stderr" REAL,
    "all_metrics" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunScores_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "Run" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunTaskMetric" (
    "run_task_metric_id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" REAL,
    CONSTRAINT "RunTaskMetric_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "Run" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunTaskHash" (
    "run_task_hash_id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "hash_examples" TEXT,
    "hash_full_prompts" TEXT,
    "hash_input_tokens" TEXT,
    "hash_cont_tokens" TEXT,
    CONSTRAINT "RunTaskHash_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "Run" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunDetailFile" (
    "run_detail_file_id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "parquet_uri" TEXT NOT NULL,
    "num_rows" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunDetailFile_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "Run" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_benchmark_key_key" ON "Benchmark"("benchmark_key");

-- CreateIndex
CREATE UNIQUE INDEX "Pack_name_version_key" ON "Pack"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PackTask_pack_id_task_spec_key" ON "PackTask"("pack_id", "task_spec");

-- CreateIndex
CREATE UNIQUE INDEX "Plugin_name_version_key" ON "Plugin"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "JudgeTemplate_name_version_key" ON "JudgeTemplate"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RunTaskMetric_run_id_task_key_metric_name_key" ON "RunTaskMetric"("run_id", "task_key", "metric_name");

-- CreateIndex
CREATE UNIQUE INDEX "RunTaskHash_run_id_task_key_key" ON "RunTaskHash"("run_id", "task_key");

-- CreateIndex
CREATE UNIQUE INDEX "RunDetailFile_run_id_task_key_key" ON "RunDetailFile"("run_id", "task_key");
