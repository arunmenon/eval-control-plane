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

  const scoringCounts: Record<string, number> = { deterministic: 0, judge: 0, jury: 0 };
  const backendCounts: Record<string, number> = {};

  for (const r of runs) {
    if (typeof r.scoring_mode === "string") {
      const key = r.scoring_mode as string;
      if (key in scoringCounts) {
        scoringCounts[key] += 1;
      }
    }
    if (typeof r.backend_type === "string") {
      backendCounts[r.backend_type] = (backendCounts[r.backend_type] ?? 0) + 1;
    }
  }

  return {
    packCount: packs.length ?? 0,
    runCount: runs.length ?? 0,
    completedRunCount: (completedData.runs ?? []).length ?? 0,
    recentRuns,
    topPacks,
    scoringCounts,
    backendCounts,
  };
}

export default async function HomePage() {
  const {
    packCount,
    runCount,
    completedRunCount,
    recentRuns,
    topPacks,
    scoringCounts,
    backendCounts,
  } = await fetchSummary();

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
            <a href="/runs/new" className="button button-primary">
              Launch run
            </a>
            <a href="/packs" className="button button-secondary">
              Browse packs
            </a>
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
            <table className="table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((r: any) => (
                  <tr key={r.run_id}>
                    <td>
                      <a href={`/runs/${r.run_id}`}>{r.run_name ?? r.run_id}</a>
                    </td>
                    <td>
                      <span className="pill">{r.status}</span>
                    </td>
                    <td>{r.scores?.pack_score != null ? r.scores.pack_score : "–"}</td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h3>Top packs</h3>
          {topPacks.length === 0 ? (
            <p className="muted">No packs yet. Create a pack to define what you care about.</p>
          ) : (
            <div className="stat-grid">
              {topPacks.map((p: any) => (
                <div key={p.packId} className="stat-card">
                  <p className="stat-label">Pack</p>
                  <p className="stat-value">
                    {p.name} <span className="muted" style={{ fontSize: "0.8rem" }}>v{p.version}</span>
                  </p>
                  <p className="stat-subtext">{p.runCount} run{p.runCount === 1 ? "" : "s"}</p>
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                    <a href={`/leaderboards/${p.packId}`} className="button button-secondary" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}>
                      Leaderboard
                    </a>
                    <a href={`/runs/new?packId=${p.packId}`} className="button button-primary" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}>
                      Run
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,2fr)", gap: "1rem", marginTop: "1.5rem" }}>
        <div className="card">
          <h3>Scoring modes</h3>
          {runCount === 0 ? (
            <p className="muted">No runs yet. Scoring breakdown will appear here.</p>
          ) : (
            <div className="bar-list">
              {(["deterministic", "judge", "jury"] as const).map((key) => {
                const count = scoringCounts[key];
                const percentage = runCount > 0 ? Math.round((count / runCount) * 100) : 0;
                const label =
                  key === "deterministic" ? "Deterministic" : key === "judge" ? "Judge" : "Jury";
                return (
                  <div key={key} className="bar-list-row">
                    <div className="bar-list-label">{label}</div>
                    <div className="bar-list-bar">
                      <div className="bar-list-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="bar-list-value">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Backends</h3>
          {runCount === 0 ? (
            <p className="muted">No runs yet. Backend usage will appear here.</p>
          ) : (
            <>
              {Object.keys(backendCounts).length === 0 ? (
                <p className="muted">No backend data yet.</p>
              ) : (
                <div className="bar-list">
                  {Object.entries(backendCounts).map(([backend, count]) => {
                    const percentage = runCount > 0 ? Math.round((count / runCount) * 100) : 0;
                    return (
                      <div key={backend} className="bar-list-row">
                        <div className="bar-list-label">{backend}</div>
                        <div className="bar-list-bar">
                          <div className="bar-list-bar-fill" style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="bar-list-value">
                          {count} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
