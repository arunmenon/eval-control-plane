const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchSummary() {
  const [packsRes, runsRes, completedRes] = await Promise.all([
    fetch(`${API_BASE}/api/packs`, { cache: "no-store" }),
    fetch(`${API_BASE}/api/runs`, { cache: "no-store" }),
    fetch(`${API_BASE}/api/runs?status=completed`, { cache: "no-store" }),
  ]);

  const packsData = packsRes.ok ? await packsRes.json() : { packs: [] };
  const runsData = runsRes.ok ? await runsRes.json() : { runs: [] };
  const completedData = completedRes.ok ? await completedRes.json() : { runs: [] };

  // Derive recent runs and top packs from the same payloads.
  const runs = Array.isArray(runsData.runs) ? runsData.runs : [];
  const packs = Array.isArray(packsData.packs) ? packsData.packs : [];

  const recentRuns = runs.slice(0, 4);

  const runCountByPack: Record<string, number> = {};
  for (const r of runs) {
    if (r.pack_id) {
      runCountByPack[r.pack_id] = (runCountByPack[r.pack_id] ?? 0) + 1;
    }
  }
  const topPacks = [...packs]
    .map((p) => ({
      ...p,
      runCount: runCountByPack[p.packId] ?? 0,
    }))
    .sort((a, b) => b.runCount - a.runCount)
    .slice(0, 3);

  return {
    packCount: packs.length ?? 0,
    runCount: runs.length ?? 0,
    completedRunCount: (completedData.runs ?? []).length ?? 0,
    recentRuns,
    topPacks,
  };
}

export default async function HomePage() {
  const { packCount, runCount, completedRunCount, recentRuns, topPacks } = await fetchSummary();

  return (
    <section>
      <div className="hero">
        <div className="hero-top">
          <div>
            <h2 className="hero-title">Evaluation control plane</h2>
            <p className="hero-subtitle">
              Curate benchmark packs, run LightEval jobs across backends, and share trustworthy leaderboards with your
              stakeholders.
            </p>
          </div>
          <div className="hero-actions">
            <a href="/runs/new">Launch run</a>
            <a href="/packs">Open packs</a>
          </div>
        </div>
        <div className="hero-grid">
          <div className="hero-metric">
            <p className="hero-metric-label">Packs</p>
            <p className="hero-metric-value">{packCount}</p>
          </div>
          <div className="hero-metric">
            <p className="hero-metric-label">Runs</p>
            <p className="hero-metric-value">{runCount}</p>
          </div>
          <div className="hero-metric">
            <p className="hero-metric-label">Completed</p>
            <p className="hero-metric-value">{completedRunCount}</p>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,2fr)", gap: "1rem", marginTop: "1.5rem" }}>
        <div className="card">
          <h3>Recent runs</h3>
          {recentRuns.length === 0 ? (
            <p className="muted">No runs yet. Launch your first evaluation.</p>
          ) : (
            <ul>
              {recentRuns.map((r: any) => (
                <li key={r.run_id}>
                  <a href={`/runs/${r.run_id}`}>{r.run_name ?? r.run_id}</a> ·{" "}
                  <span>{r.status}</span> ·{" "}
                  <span>{r.scores?.pack_score != null ? `score ${r.scores.pack_score}` : "no score yet"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Top packs</h3>
          {topPacks.length === 0 ? (
            <p className="muted">No packs yet. Create a pack to define what you care about.</p>
          ) : (
            <ul>
              {topPacks.map((p: any) => (
                <li key={p.packId}>
                  <a href={`/packs/${p.packId}`}>{p.name}</a> <span className="muted">v{p.version}</span> ·{" "}
                  <span className="muted">{p.runCount} run(s)</span> ·{" "}
                  <a href={`/leaderboards/${p.packId}`}>leaderboard</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
