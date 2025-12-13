const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchBenchmarks(q?: string) {
  const url = new URL(`${API_BASE}/api/benchmarks`);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load benchmarks");
  return res.json() as Promise<{ benchmarks: any[] }>;
}

function scoringBadge(mode: string) {
  if (mode === "deterministic") return <span className="badge badge-deterministic">Deterministic</span>;
  if (mode === "judge") return <span className="badge badge-judge">Judge</span>;
  if (mode === "jury") return <span className="badge badge-jury">Jury</span>;
  return <span className="badge badge-default">{mode}</span>;
}

interface BenchmarksPageProps {
  searchParams?: { q?: string };
}

export default async function BenchmarksPage({ searchParams }: BenchmarksPageProps) {
  const q = searchParams?.q ?? "";
  const { benchmarks } = await fetchBenchmarks(q);

  return (
    <section>
      <h2>Benchmarks</h2>
      <p className="muted">
        Browse built-in LightEval tasks and custom benchmarks. Use packs to curate what matters for your leadership
        view.
      </p>
      <form method="get" style={{ marginBottom: "1rem" }}>
        <div className="form-field">
          <label htmlFor="q">Search benchmarks</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search benchmarks (e.g., gsm8k, truthfulqa, mt-bench)"
          />
        </div>
      </form>
      {benchmarks.map((b) => (
        <article key={b.benchmark_id} className="card">
          <h3>
            <a href={`/benchmarks/${encodeURIComponent(b.benchmark_key)}`}>{b.task_name}</a>
          </h3>
          <div>
            <span className="badge badge-default">{b.suite}</span>
            {scoringBadge(b.scoring_mode)}
          </div>
          <p className="muted">{b.description ?? b.benchmark_key}</p>
        </article>
      ))}
      {benchmarks.length === 0 && <p className="muted">No benchmarks found.</p>}
    </section>
  );
}
