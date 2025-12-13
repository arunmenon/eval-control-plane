const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchRuns(status?: string, scoringMode?: string) {
  const url = new URL(`${API_BASE}/api/runs`);
  if (status) url.searchParams.set("status", status);
  if (scoringMode) url.searchParams.set("scoringMode", scoringMode);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load runs");
  return res.json() as Promise<{ runs: any[] }>;
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

interface RunsPageProps {
  searchParams?: { status?: string; scoringMode?: string };
}

export default async function RunsPage({ searchParams }: RunsPageProps) {
  const status = searchParams?.status ?? "";
  const scoringMode = searchParams?.scoringMode ?? "";
  const { runs } = await fetchRuns(status || undefined, scoringMode || undefined);

  return (
    <section>
      <h2>Runs</h2>
      <p className="muted">
        Inspect historical runs, their scoring modes, and pack scores. Use this view to answer “what did we run, on
        which model, and how did we score it?”.
      </p>
      <p className="muted">
        <a href="/runs/new">Create a new run</a>
      </p>
      <form method="get" style={{ marginBottom: "1rem" }}>
        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="scoringMode">Scoring mode</label>
          <select id="scoringMode" name="scoringMode" defaultValue={scoringMode}>
            <option value="">All</option>
            <option value="deterministic">Deterministic</option>
            <option value="judge">Judge</option>
            <option value="jury">Jury</option>
          </select>
        </div>
        <button className="button" type="submit">
          Apply filters
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Run</th>
            <th>Status</th>
            <th>Model</th>
            <th>Scoring</th>
            <th>Pack score</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.run_id}>
              <td>
                <a href={`/runs/${r.run_id}`}>{r.run_name ?? r.run_id}</a>
              </td>
              <td>{statusPill(r.status)}</td>
              <td>{r.model_name}</td>
              <td>{scoringBadge(r.scoring_mode)}</td>
              <td>{r.scores?.pack_score ?? "-"}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {runs.length === 0 && <p className="muted">No runs yet.</p>}
    </section>
  );
}
