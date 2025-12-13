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
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { run } = await fetchRun(params.runId);

  const tasksWithDetails = new Set(
    run.detailFiles.map((df: any) => df.task_key),
  );

  const created = run.created_at ? new Date(run.created_at) : null;

  return (
    <section>
      <h2>{run.run_name ?? run.run_id}</h2>
      <p className="muted">
        <span style={{ marginRight: "0.5rem" }}>{statusPill(run.status)}</span>
        Model: {run.model_name} · Backend: {run.backend_type} · Scoring: {scoringBadge(run.scoring_mode)}
      </p>
      {created && <p className="muted">Created: {created.toLocaleString()}</p>}
      {run.scores?.pack_score !== null && run.scores?.pack_score !== undefined && (
        <p>
          Pack score: <strong>{run.scores.pack_score}</strong>{" "}
          {run.scores.pack_score_stderr !== null && (
            <span className="muted">(±{run.scores.pack_score_stderr})</span>
          )}
        </p>
      )}
      {run.scoring_config && (run.scoring_mode === "judge" || run.scoring_mode === "jury") && (
        <>
          <h3>Scoring configuration</h3>
          <p className="muted">
            {run.scoring_mode === "judge"
              ? "Single judge configuration"
              : "Jury configuration with multiple judges"}
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
    </section>
  );
}
