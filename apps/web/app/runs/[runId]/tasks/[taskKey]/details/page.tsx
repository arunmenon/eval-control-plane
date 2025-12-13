const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchDetails(runId: string, taskKey: string) {
  const res = await fetch(
    `${API_BASE}/api/runs/${runId}/tasks/${encodeURIComponent(taskKey)}/details?page=1&pageSize=20`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Details not found");
  return res.json() as Promise<{ rows: any[] }>;
}

interface TaskDetailsPageProps {
  params: { runId: string; taskKey: string };
}

export default async function TaskDetailsPage({ params }: TaskDetailsPageProps) {
  const { rows } = await fetchDetails(params.runId, params.taskKey);

  return (
    <section>
      <h2>
        Samples for {params.taskKey} (run {params.runId})
      </h2>
      {rows.map((row, idx) => (
        <article key={idx} className="card">
          {"__doc__" in row && (
            <>
              <h3>Doc</h3>
              <pre>{JSON.stringify(row.__doc__, null, 2)}</pre>
            </>
          )}
          {"__model_response__" in row && (
            <>
              <h3>Model response</h3>
              <pre>{String(row.__model_response__)}</pre>
            </>
          )}
          {"__metric__" in row && (
            <>
              <h3>Metric</h3>
              <pre>{JSON.stringify(row.__metric__, null, 2)}</pre>
            </>
          )}
        </article>
      ))}
      {rows.length === 0 && <p className="muted">No samples available.</p>}
    </section>
  );
}

