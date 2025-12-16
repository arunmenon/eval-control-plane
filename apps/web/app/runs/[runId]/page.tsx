const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchRun(runId: string) {
  const res = await fetch(`${API_BASE}/api/runs/${runId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Run not found");
  return res.json() as Promise<{ run: any }>;
}

function scoringBadge(mode: string) {
  if (mode === "deterministic") return <span className="badge badge-deterministic">Deterministic</span>;
  if (mode === "judge") return <span className="badge badge-judge">Judge</span>;
  if (mode === "jury") return <span className="badge badge-jury">Jury</span>;
  return <span className="badge badge-default">{mode}</span>;
}

function statusPill(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "queued") return <span className="pill status-queued">Queued</span>;
  if (normalized === "running") return <span className="pill status-running">Running</span>;
  if (normalized === "completed") return <span className="pill status-completed">Completed</span>;
  if (normalized === "failed") return <span className="pill status-failed">Failed</span>;
  return <span className="pill status-queued">{status}</span>;
}

interface RunDetailPageProps {
  params: { runId: string };
  searchParams?: { tab?: string };
}

export default async function RunDetailPage({ params, searchParams }: RunDetailPageProps) {
  const { run } = await fetchRun(params.runId);

  const tasksWithDetails = new Set(
    run.detailFiles.map((df: any) => df.task_key),
  );

  const created = run.created_at ? new Date(run.created_at) : null;
   const activeTab = searchParams?.tab ?? "overview";

  const hasScore = run.scores?.pack_score !== null && run.scores?.pack_score !== undefined;
  const scoreValue: number | null = hasScore ? run.scores.pack_score : null;
  const scorePercent =
    typeof scoreValue === "number"
      ? Math.max(0, Math.min(1, scoreValue)) * 100
      : 0;

  const hasDetailsTasks = run.detailFiles && run.detailFiles.length > 0;

  return (
    <section>
      <div className="card">
        <h2>{run.run_name ?? run.run_id}</h2>
        <p className="muted">
          <span style={{ marginRight: "0.5rem" }}>{statusPill(run.status)}</span>
          Model: {run.model_name} · Backend: {run.backend_type} · Scoring: {scoringBadge(run.scoring_mode)}
        </p>
        {created && <p className="muted">Created: {created.toLocaleString()}</p>}
        {hasScore && (
          <div style={{ marginTop: "0.75rem" }}>
            <p className="stat-label">Pack score</p>
            <p className="stat-value">
              {run.scores.pack_score}{" "}
              {run.scores.pack_score_stderr !== null && (
                <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  (±{run.scores.pack_score_stderr})
                </span>
              )}
            </p>
            <div className="score-bar">
              <div className="score-bar-fill" style={{ width: `${scorePercent}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="tabs">
        <div className="tabs-list">
          {["overview", "metrics", "scoring", "artifacts", "samples"].map((key) => {
            const label =
              key === "overview"
                ? "Overview"
                : key === "metrics"
                ? "Metrics"
                : key === "scoring"
                ? "Scoring"
                : key === "artifacts"
                ? "Artifacts"
                : "Samples";
            const href = `/runs/${run.run_id}?tab=${key}`;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                className={`tabs-trigger ${isActive ? "tabs-trigger-active" : ""}`}
              >
                <a href={href}>{label}</a>
              </button>
            );
          })}
        </div>
        <div className="tabs-panel">
          {activeTab === "overview" && (
            <div className="card">
              <h3>Run summary</h3>
              <p className="muted">
                Pack: {run.pack?.name} {run.pack?.version ? `(v${run.pack.version})` : ""} ·{" "}
                {run.scoring_mode === "deterministic"
                  ? "Deterministic scoring"
                  : run.scoring_mode === "judge"
                  ? "Judge-based scoring"
                  : "Jury scoring"}
              </p>
              {!hasScore && <p className="muted">No pack score yet for this run.</p>}
              {hasDetailsTasks ? (
                <p className="muted">
                  Sample details are available for at least one task. Use the Samples tab or the “View samples” links in
                  Metrics to drill down.
                </p>
              ) : (
                <p className="muted">
                  Sample explorer is unavailable for this run. Enable “Save details” for future runs to debug at the
                  sample level.
                </p>
              )}
            </div>
          )}
          {activeTab === "metrics" && (
            <div className="card">
              <h3>Task metrics</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Task key</th>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {run.taskMetrics.map((m: any) => (
                    <tr key={m.run_task_metric_id}>
                      <td>{m.task_key}</td>
                      <td>{m.metric_name}</td>
                      <td>{m.metric_value}</td>
                      <td>
                        {tasksWithDetails.has(m.task_key) && (
                          <a href={`/runs/${run.run_id}/tasks/${encodeURIComponent(m.task_key)}/details`}>
                            View samples
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "scoring" && (
            <div className="card">
              <h3>Scoring configuration</h3>
              {run.scoring_mode === "deterministic" && (
                <p className="muted">
                  Deterministic scoring based on metrics defined in the underlying LightEval tasks. Use this mode when
                  you have a reference answer or heuristic scoring function.
                </p>
              )}
              {(run.scoring_mode === "judge" || run.scoring_mode === "jury") && (
                <>
                  <p className="muted">
                    {run.scoring_mode === "judge"
                      ? "Single judge configuration (model-graded scores)."
                      : "Jury configuration with multiple judges and aggregation."}
                  </p>
                  {Array.isArray(run.scoring_config.judges) && run.scoring_config.judges.length > 0 && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Judge model</th>
                          <th>Backend</th>
                          <th>Max tokens</th>
                          <th>Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.scoring_config.judges.map((j: any, idx: number) => (
                          <tr key={idx}>
                            <td>{j.judge_model_name}</td>
                            <td>{j.judge_backend}</td>
                            <td>{j.max_tokens ?? "-"}</td>
                            <td>{j.weight ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}
          {activeTab === "artifacts" && (
            <div className="card">
              <h3>Artifacts</h3>
              {run.artifacts ? (
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Results JSON</th>
                      <td className="muted">{run.artifacts.results_json_uri ?? "—"}</td>
                    </tr>
                    <tr>
                      <th>Details base URI</th>
                      <td className="muted">{run.artifacts.details_base_uri ?? "—"}</td>
                    </tr>
                    <tr>
                      <th>Logs URI</th>
                      <td className="muted">{run.artifacts.logs_uri ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="muted">No artifact URIs recorded for this run.</p>
              )}
            </div>
          )}
          {activeTab === "samples" && (
            <div className="card">
              <h3>Samples</h3>
              {hasDetailsTasks ? (
                <>
                  <p className="muted">
                    Sample explorer is implemented per task. Choose a task below to open its samples view.
                  </p>
                  <ul>
                    {run.detailFiles.map((df: any) => (
                      <li key={df.run_detail_file_id}>
                        <a href={`/runs/${run.run_id}/tasks/${encodeURIComponent(df.task_key)}/details`}>
                          {df.task_key}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted">
                  No details files were saved for this run. Enable “Save details” when launching runs to inspect
                  per-sample prompts and model responses.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
