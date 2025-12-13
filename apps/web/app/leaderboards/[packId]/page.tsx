const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchLeaderboard(packId: string) {
  const res = await fetch(`${API_BASE}/api/leaderboards/${packId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Leaderboard not found");
  return res.json() as Promise<{ packId: string; primaryMetric: string; leaderboard: any[] }>;
}

function scoringBadge(mode: string) {
  if (mode === "deterministic") return <span className="badge badge-deterministic">Deterministic</span>;
  if (mode === "judge") return <span className="badge badge-judge">Judge</span>;
  if (mode === "jury") return <span className="badge badge-jury">Jury</span>;
  return <span className="badge badge-default">{mode}</span>;
}

interface LeaderboardPageProps {
  params: { packId: string };
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const data = await fetchLeaderboard(params.packId);

  const hasEntries = data.leaderboard.length > 0;

  return (
    <section>
      <h2>Leaderboard for pack {data.packId}</h2>
      <p className="muted">
        Primary metric: <strong>{data.primaryMetric}</strong>. Higher is better unless specified otherwise.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Run</th>
            <th>Model</th>
            <th>Score</th>
            <th>Scoring</th>
            <th>Backend</th>
            <th>Run time</th>
          </tr>
        </thead>
        <tbody>
          {data.leaderboard.map((entry) => (
            <tr key={entry.runId}>
              <td>{entry.rank}</td>
              <td>
                <a href={`/runs/${entry.runId}`}>{entry.runId}</a>
              </td>
              <td>{entry.modelName}</td>
              <td>{entry.packScore}</td>
              <td>{scoringBadge(entry.scoringMode)}</td>
              <td>{entry.backendType}</td>
              <td>{new Date(entry.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.leaderboard.length === 0 && <p className="muted">No completed runs yet.</p>}
    </section>
  );
}
