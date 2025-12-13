const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchBenchmark(benchmarkKey: string) {
  const decodedKey = decodeURIComponent(benchmarkKey);

  const inspectRes = await fetch(
    `${API_BASE}/api/benchmarks/${encodeURIComponent(decodedKey)}/inspect`,
    {
      cache: "no-store",
    },
  );
  if (inspectRes.ok) {
    return inspectRes.json() as Promise<{ benchmark: any; inspect: any | null }>;
  }

  // Fallback to the basic benchmark endpoint if inspect is not available.
  const basicRes = await fetch(`${API_BASE}/api/benchmarks/${encodeURIComponent(decodedKey)}`, {
    cache: "no-store",
  });
  if (!basicRes.ok) return null;
  const basic = await basicRes.json();
  return { benchmark: basic.benchmark, inspect: null } as { benchmark: any; inspect: any | null };
}

interface BenchmarkDetailPageProps {
  params: { benchmarkKey: string };
  searchParams?: { tab?: string };
}

export default async function BenchmarkDetailPage({ params, searchParams }: BenchmarkDetailPageProps) {
  const data = await fetchBenchmark(params.benchmarkKey);
  if (!data) {
    return (
      <section>
        <h2>Benchmark not found</h2>
        <p className="muted">This benchmark key is not present in the registry yet.</p>
      </section>
    );
  }

  const { benchmark, inspect } = data;
  const dataset = inspect?.config?.dataset ?? {};
  const metrics = Array.isArray(inspect?.config?.metrics) ? inspect.config.metrics : [];
  const requirements = Array.isArray(inspect?.requirements) ? inspect.requirements : [];

  const tab = (searchParams?.tab ?? "overview").toLowerCase();
  const activeTab =
    tab === "overview" || tab === "dataset" || tab === "metrics" || tab === "requirements" || tab === "how-to-run"
      ? tab
      : "overview";

  const baseHref = `/benchmarks/${encodeURIComponent(benchmark.benchmark_key)}`;

  return (
    <section>
      <h2>{benchmark.task_name}</h2>
      <p className="muted">{benchmark.description ?? benchmark.benchmark_key}</p>

      <div style={{ marginBottom: "1rem" }}>
        <a
          href={`${baseHref}?tab=overview`}
          className={activeTab === "overview" ? "badge badge-default" : "badge"}
        >
          Overview
        </a>
        <a
          href={`${baseHref}?tab=dataset`}
          className={activeTab === "dataset" ? "badge badge-default" : "badge"}
        >
          Dataset
        </a>
        <a
          href={`${baseHref}?tab=metrics`}
          className={activeTab === "metrics" ? "badge badge-default" : "badge"}
        >
          Metrics
        </a>
        <a
          href={`${baseHref}?tab=requirements`}
          className={activeTab === "requirements" ? "badge badge-default" : "badge"}
        >
          Requirements
        </a>
        <a
          href={`${baseHref}?tab=how-to-run`}
          className={activeTab === "how-to-run" ? "badge badge-default" : "badge"}
        >
          How to run
        </a>
      </div>

      {activeTab === "overview" && (
        <>
          <h3>Overview</h3>
          <dl>
            <dt>Suite</dt>
            <dd>{benchmark.suite}</dd>
            <dt>Source type</dt>
            <dd>{benchmark.source_type}</dd>
            <dt>Scoring mode</dt>
            <dd>{benchmark.scoring_mode}</dd>
          </dl>
        </>
      )}

      {activeTab === "dataset" && (
        <>
          <h3>Dataset</h3>
          <dl>
            {dataset.hf_repo && (
              <>
                <dt>HF repo</dt>
                <dd>{dataset.hf_repo}</dd>
              </>
            )}
            {dataset.hf_subset && (
              <>
                <dt>HF subset</dt>
                <dd>{dataset.hf_subset}</dd>
              </>
            )}
            {Array.isArray(dataset.evaluation_splits) && dataset.evaluation_splits.length > 0 && (
              <>
                <dt>Evaluation splits</dt>
                <dd>{dataset.evaluation_splits.join(", ")}</dd>
              </>
            )}
            {dataset.hf_revision && (
              <>
                <dt>Revision</dt>
                <dd>{dataset.hf_revision}</dd>
              </>
            )}
          </dl>
        </>
      )}

      {activeTab === "metrics" && (
        <>
          <h3>Metrics</h3>
          {metrics.length === 0 ? (
            <p className="muted">No metrics metadata available from LightEval for this task.</p>
          ) : (
            <ul>
              {metrics.map((m: any, idx: number) => {
                const name = m.name ?? m.metric_name ?? m.id ?? `metric_${idx}`;
                const higherIsBetter = m.higher_is_better ?? m.higherIsBetter;
                return (
                  <li key={idx}>
                    {name}
                    {typeof higherIsBetter === "boolean" && (
                      <span className="muted"> ({higherIsBetter ? "higher is better" : "lower is better"})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {activeTab === "requirements" && (
        <>
          <h3>Requirements</h3>
          {requirements.length === 0 ? (
            <p className="muted">No special requirements defined for this benchmark.</p>
          ) : (
            <ul>
              {requirements.map((r: string, idx: number) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          )}
        </>
      )}

      {activeTab === "how-to-run" && (
        <>
          <h3>How to run</h3>
          <p className="muted">
            This benchmark can be executed via LightEval by referencing its task key. For example:
          </p>
          <pre>
            <code>lighteval eval --model &lt;your-model&gt; --tasks {benchmark.benchmark_key}</code>
          </pre>
          <p className="muted">
            In this platform, include it in a pack and launch a run from the &quot;New run&quot; wizard.
          </p>
        </>
      )}
    </section>
  );
}
