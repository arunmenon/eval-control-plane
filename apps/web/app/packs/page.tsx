const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchPacks() {
  const res = await fetch(`${API_BASE}/api/packs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load packs");
  return res.json() as Promise<{ packs: any[] }>;
}

export default async function PacksPage() {
  const { packs } = await fetchPacks();

  return (
    <section>
      <h2>Packs</h2>
      <p className="muted">
        Packs are leadership-facing bundles of benchmarks with a single scoring policy. Use them to define “Reasoning
        Core v1” and similar views.
      </p>
      {packs.map((p) => (
        <article key={p.packId} className="card">
          <h3>
            <a href={`/packs/${p.packId}`}>{p.name}</a> <span className="muted">v{p.version}</span>
          </h3>
          <p className="muted">{p.description}</p>
          <p>
            Primary metric: <strong>{p.primaryMetric}</strong> · Tasks: {p.taskCount}
          </p>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <a href={`/runs/new?packId=${p.packId}`} className="button button-primary">
              Run this pack
            </a>
            <a href={`/leaderboards/${p.packId}`} className="button button-secondary">
              View leaderboard
            </a>
          </div>
        </article>
      ))}
      {packs.length === 0 && <p className="muted">No packs found.</p>}
    </section>
  );
}
