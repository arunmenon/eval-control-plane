const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchComparison(runIdA: string, runIdB: string) {
  const url = new URL(`${API_BASE}/api/runs/compare`);
  url.searchParams.set("runIdA", runIdA);
  url.searchParams.set("runIdB", runIdB);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load comparison");
  return res.json() as Promise<{ runA: any; runB: any }>;
}

function scoringBadge(mode: string) {
  if (mode === "deterministic") return <span className="badge badge-deterministic">Deterministic</span>;
  if (mode === "judge") return <span className="badge badge-judge">Judge</span>;
  if (mode === "jury") return <span className="badge badge-jury">Jury</span>;
  return <span className="badge badge-default">{mode}</span>;
}

interface RunComparePageProps {
  searchParams?: { runIdA?: string; runIdB?: string };
}

export default async function RunComparePage({ searchParams }: RunComparePageProps) {
  const runIdA = searchParams?.runIdA;
  const runIdB = searchParams?.runIdB;

  if (!runIdA || !runIdB) {
    return (
      <section>
        <h2>Compare runs</h2>
        <p className="muted">Provide runIdA and runIdB as query parameters to compare two runs.</p>
      </section>
    );
  }

  const { runA, runB } = await fetchComparison(runIdA, runIdB);

  // Build a per-task, per-metric comparison map.
  const metricMap = new Map<
    string,
    {
      metricName: string;
      valueA: number | null | undefined;
      valueB: number | null | undefined;
    }
  >();

  for (const m of runA.taskMetrics) {
    const key = `${m.task_key}::${m.metric_name}`;
    metricMap.set(key, {
      metricName: `${m.task_key} – ${m.metric_name}`,
      valueA: m.metric_value,
      valueB: undefined,
    });
  }

  for (const m of runB.taskMetrics) {
    const key = `${m.task_key}::${m.metric_name}`;
    const existing = metricMap.get(key);
    if (existing) {
      existing.valueB = m.metric_value;
    } else {
      metricMap.set(key, {
        metricName: `${m.task_key} – ${m.metric_name}`,
        valueA: undefined,
        valueB: m.metric_value,
      });
    }
  }

  const metrics = Array.from(metricMap.values());

  return (
    <section>
      <h2>Compare runs</h2>
      <p className="muted">
        Comparing <code>{runIdA}</code> and <code>{runIdB}</code>.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1rem", marginTop: "1rem" }}>
        <div className="card">
          <h3>{runA.run_name ?? runA.run_id}</h3>
          <p className="muted">
            Model: {runA.model_name} · Backend: {runA.backend_type} · {scoringBadge(runA.scoring_mode)}
          </p>
          {runA.scores?.pack_score != null && (
            <p>
              Pack score: <strong>{runA.scores.pack_score}</strong>{" "}
              {runA.scores.pack_score_stderr != null && (
                <span className="muted">(±{runA.scores.pack_score_stderr})</span>
              )}
            </p>
          )}
        </div>
        <div className="card">
          <h3>{runB.run_name ?? runB.run_id}</h3>
          <p className="muted">
            Model: {runB.model_name} · Backend: {runB.backend_type} · {scoringBadge(runB.scoring_mode)}
          </p>
          {runB.scores?.pack_score != null && (
            <p>
              Pack score: <strong>{runB.scores.pack_score}</strong>{" "}
              {runB.scores.pack_score_stderr != null && (
                <span className="muted">(±{runB.scores.pack_score_stderr})</span>
              )}
            </p>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>Per-task metrics</h3>
        {metrics.length === 0 ? (
          <p className="muted">No metrics available to compare.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Task / Metric</th>
                <th>{runA.run_name ?? "Run A"}</th>
                <th>{runB.run_name ?? "Run B"}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, idx) => (
                <tr key={idx}>
                  <td>{m.metricName}</td>
                  <td>{m.valueA != null ? m.valueA : "-"}</td>
                  <td>{m.valueB != null ? m.valueB : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

