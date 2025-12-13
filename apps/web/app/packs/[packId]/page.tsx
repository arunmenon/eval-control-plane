const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchPack(packId: string) {
  const res = await fetch(`${API_BASE}/api/packs/${packId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Pack not found");
  return res.json() as Promise<{ pack: any }>;
}

interface PackDetailPageProps {
  params: { packId: string };
}

export default async function PackDetailPage({ params }: PackDetailPageProps) {
  const { pack } = await fetchPack(params.packId);

  return (
    <section>
      <h2>
        {pack.name} <span className="muted">v{pack.version}</span>
      </h2>
      <p className="muted">{pack.description}</p>
      <p>
        Primary metric: <strong>{pack.primaryMetric}</strong> · Aggregation: {pack.aggregation}
      </p>
      <p>
        <a href={`/leaderboards/${pack.packId}`}>View leaderboard</a> ·{" "}
        <a href={`/runs/new?packId=${pack.packId}`}>Run this pack</a>
      </p>
      <h3>Tasks in this pack</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Fewshot</th>
            <th>Weight</th>
            <th>Scoring</th>
          </tr>
        </thead>
        <tbody>
          {pack.tasks.map((t: any) => (
            <tr key={t.packTaskId}>
              <td>{t.taskSpec}</td>
              <td>{t.fewshot}</td>
              <td>{t.weight}</td>
              <td>{scoringBadge(t.benchmark.scoringMode)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
function scoringBadge(mode: string) {
  if (mode === "deterministic") return <span className="badge badge-deterministic">Deterministic</span>;
  if (mode === "judge") return <span className="badge badge-judge">Judge</span>;
  if (mode === "jury") return <span className="badge badge-jury">Jury</span>;
  return <span className="badge badge-default">{mode}</span>;
}
