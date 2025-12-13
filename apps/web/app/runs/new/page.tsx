"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface PackSummary {
  packId: string;
  name: string;
  version: string;
}

async function fetchPacks(): Promise<PackSummary[]> {
  const res = await fetch(`${API_BASE}/api/packs`);
  if (!res.ok) throw new Error("Failed to load packs");
  const data = await res.json();
  return data.packs;
}

async function fetchPackDetail(packId: string) {
  const res = await fetch(`${API_BASE}/api/packs/${packId}`);
  if (!res.ok) throw new Error("Pack not found");
  return res.json();
}

export default function NewRunPage() {
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");
  const [backendType, setBackendType] = useState<string>("endpoint_inference_providers");
  const [scoringMode, setScoringMode] = useState<"deterministic" | "judge" | "jury">("deterministic");
  const [judgeModelName, setJudgeModelName] = useState<string>("");
  const [judgeBackend, setJudgeBackend] = useState<string>("litellm");
  const [judgeMaxTokens, setJudgeMaxTokens] = useState<number>(512);
  const [juryCount, setJuryCount] = useState<number>(3);
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPacks()
      .then(setPacks)
      .catch((err) => setStatus(String(err)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPackId || !modelName) {
      setStatus("Pack and model name are required.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      const packDetail = await fetchPackDetail(selectedPackId);
      const tasks = packDetail.pack.tasks.map((t: any) => ({
        id: t.taskSpec,
        fewshot: t.fewshot,
      }));

      let scoringConfig: any | undefined;
      if (scoringMode === "judge") {
        scoringConfig = {
          judges: [
            {
              judge_model_name: judgeModelName || modelName,
              judge_backend: judgeBackend,
              max_tokens: judgeMaxTokens,
              weight: 1.0,
            },
          ],
          aggregation: "mean",
          report_disagreement: false,
        };
      } else if (scoringMode === "jury") {
        const judges = [];
        const count = juryCount > 0 ? juryCount : 3;
        const weight = 1 / count;
        for (let i = 0; i < count; i += 1) {
          judges.push({
            judge_model_name: judgeModelName || modelName,
            judge_backend: judgeBackend,
            max_tokens: judgeMaxTokens,
            weight,
          });
        }
        scoringConfig = {
          judges,
          aggregation: "mean",
          report_disagreement: true,
        };
      }

      const jobSpec = {
        benchmark_pack_id: selectedPackId,
        run_name: `${packDetail.pack.name} - ${modelName}`,
        backend: {
          type: backendType,
          model_name: modelName,
        },
        tasks,
        artifacts: {
          output_dir: `/tmp/evaluator-runs/${selectedPackId}`,
          save_details: true,
        },
        scoring_mode: scoringMode,
        scoring_config: scoringConfig,
      };

      const res = await fetch(`${API_BASE}/api/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobSpec),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create run");
      }

      const data = await res.json();
      setStatus(`Run created: ${data.runId}`);
    } catch (err) {
      setStatus(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>New run</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="pack">Pack</label>
          <select
            id="pack"
            value={selectedPackId}
            onChange={(e) => setSelectedPackId(e.target.value)}
          >
            <option value="">Select a pack</option>
            {packs.map((p) => (
              <option key={p.packId} value={p.packId}>
                {p.name} (v{p.version})
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="model">Model name</label>
          <input
            id="model"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. deepseek-ai/DeepSeek-R1"
          />
        </div>
        <div className="form-field">
          <label htmlFor="backend">Backend type</label>
          <select
            id="backend"
            value={backendType}
            onChange={(e) => setBackendType(e.target.value)}
          >
            <option value="endpoint_inference_providers">Endpoint (Inference Providers)</option>
            <option value="endpoint_litellm">Endpoint (LiteLLM)</option>
            <option value="vllm">Local GPU (vLLM)</option>
            <option value="accelerate">Local / Accelerate</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="scoringMode">Scoring mode</label>
          <select
            id="scoringMode"
            value={scoringMode}
            onChange={(e) => setScoringMode(e.target.value as any)}
          >
            <option value="deterministic">Deterministic (rules/heuristics)</option>
            <option value="judge">Judge-based (LLM-as-judge)</option>
            <option value="jury">Jury (multi-judge)</option>
          </select>
        </div>
        {(scoringMode === "judge" || scoringMode === "jury") && (
          <>
            <div className="form-field">
              <label htmlFor="judgeModel">Judge model name</label>
              <input
                id="judgeModel"
                value={judgeModelName}
                onChange={(e) => setJudgeModelName(e.target.value)}
                placeholder="e.g. gpt-4.1-mini"
              />
            </div>
            <div className="form-field">
              <label htmlFor="judgeBackend">Judge backend</label>
              <select
                id="judgeBackend"
                value={judgeBackend}
                onChange={(e) => setJudgeBackend(e.target.value)}
              >
                <option value="litellm">LiteLLM</option>
                <option value="openai">OpenAI</option>
                <option value="transformers">Transformers</option>
                <option value="vllm">vLLM</option>
                <option value="tgi">TGI</option>
                <option value="inference-providers">Inference Providers</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="judgeMaxTokens">Judge max tokens</label>
              <input
                id="judgeMaxTokens"
                type="number"
                min={1}
                value={judgeMaxTokens}
                onChange={(e) => setJudgeMaxTokens(Number(e.target.value) || 1)}
              />
            </div>
          </>
        )}
        {scoringMode === "jury" && (
          <div className="form-field">
            <label htmlFor="juryCount">Number of judges</label>
            <input
              id="juryCount"
              type="number"
              min={2}
              value={juryCount}
              onChange={(e) => setJuryCount(Number(e.target.value) || 2)}
            />
          </div>
        )}
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Launching..." : "Launch run"}
        </button>
      </form>
      {status && <p className="muted" style={{ marginTop: "1rem" }}>{status}</p>}
    </section>
  );
}
