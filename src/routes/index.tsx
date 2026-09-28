import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  collegeModel,
  predictCluster,
  clusterStats,
  CLUSTER_COLORS,
  formatINR,
  type CollegeInput,
  type Prediction,
} from "@/lib/kmeans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "College Cluster Predictor — KMeans Model Demo" },
      {
        name: "description",
        content:
          "Interactive demo of a KMeans clustering model that groups 500 Indian engineering colleges into Best, Mid-Level and Emerging tiers. Enter college stats and get an instant prediction.",
      },
      { property: "og:title", content: "College Cluster Predictor — KMeans Model Demo" },
      {
        property: "og:description",
        content:
          "See a KMeans machine-learning model classify colleges into Best, Mid-Level and Emerging tiers — live in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES: {
  key: keyof CollegeInput;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}[] = [
  { key: "studentFacultyRatio", label: "Student–Faculty Ratio", min: 5, max: 40, step: 1, hint: "Students per faculty member" },
  { key: "annualFees", label: "Annual Fees (₹)", min: 20000, max: 250000, step: 1000, hint: "Tuition per year in INR" },
  { key: "placementPercentage", label: "Placement %", min: 0, max: 100, step: 1, hint: "Students placed on campus" },
  { key: "averagePackage", label: "Average Package (LPA)", min: 1, max: 15, step: 0.1, hint: "Mean salary offer" },
  { key: "infrastructureScore", label: "Infrastructure Score", min: 1, max: 10, step: 1, hint: "Campus facilities, 1–10" },
];

function ScatterPlot({ highlight }: { highlight: CollegeInput | null }) {
  const W = 760, H = 420, P = 48;
  const x = (v: number) => P + ((v - 30) / 70) * (W - P * 2);
  const y = (v: number) => H - P - ((v - 2) / 10.5) * (H - P * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* grid */}
      {[40, 55, 70, 85, 100].map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={y(2)} x2={x(t)} y2={y(12.5)} stroke="var(--border)" strokeDasharray="3 5" />
          <text x={x(t)} y={H - P + 20} textAnchor="middle" fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-mono)">{t}%</text>
        </g>
      ))}
      {[3, 5.5, 8, 10.5].map((t) => (
        <g key={t}>
          <line x1={x(30)} y1={y(t)} x2={x(100)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 5" />
          <text x={P - 10} y={y(t) + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-mono)">{t}L</text>
        </g>
      ))}
      {collegeModel.colleges.map((c, i) => (
        <circle
          key={i}
          cx={x(c.Placement_Percentage)}
          cy={y(c.Average_Package_LPA)}
          r="3.2"
          fill={CLUSTER_COLORS[c.Category]}
          opacity="0.55"
        />
      ))}
      {highlight && (
        <g>
          <circle
            cx={x(highlight.placementPercentage)}
            cy={y(highlight.averagePackage)}
            r="11"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="1.5"
            className="animate-pulse-dot"
          />
          <circle
            cx={x(highlight.placementPercentage)}
            cy={y(highlight.averagePackage)}
            r="6"
            fill="var(--foreground)"
            stroke="var(--background)"
            strokeWidth="2"
          />
        </g>
      )}
      <text x={W / 2} y={H - 6} textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">Placement Percentage →</text>
      <text x={14} y={H / 2} textAnchor="middle" fill="var(--muted-foreground)" fontSize="12" transform={`rotate(-90 14 ${H / 2})`}>Average Package (LPA) →</text>
    </svg>
  );
}

function Index() {
  const stats = useMemo(clusterStats, []);
  const [input, setInput] = useState<CollegeInput>({
    studentFacultyRatio: 15,
    annualFees: 120000,
    placementPercentage: 85,
    averagePackage: 8.5,
    infrastructureScore: 8,
  });
  const [result, setResult] = useState<Prediction | null>(null);

  const predict = () => setResult(predictCluster(input));

  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">K3</div>
            <span className="font-display text-lg font-semibold tracking-tight">College Cluster Predictor</span>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
            model live · in-browser
          </span>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center animate-float-in">
        <p className="font-mono text-xs tracking-[0.3em] text-primary uppercase">KMeans · k = 3 · StandardScaler</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Watch the model sort <span className="text-primary text-glow">500 colleges</span> into three tiers
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
          The clustering model from my notebook — trained on fees, placements, packages, faculty ratio and
          infrastructure — running entirely in your browser. Scroll down, enter any college's numbers, and
          see which tier it lands in.
        </p>
      </section>

      {/* cluster cards */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <div key={s.name} className="rounded-2xl border border-border bg-card p-6 card-glow animate-float-in" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: CLUSTER_COLORS[s.name] }} />
                <h3 className="font-display font-semibold">{s.name}</h3>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{s.count} colleges</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Avg placement</dt><dd className="font-mono">{s.avgPlacement.toFixed(1)}%</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Avg package</dt><dd className="font-mono">{s.avgPackage.toFixed(2)} LPA</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Avg fees</dt><dd className="font-mono">{formatINR(s.avgFees)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Avg infra score</dt><dd className="font-mono">{s.avgInfra.toFixed(1)}/10</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* scatter */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-2xl border border-border bg-card p-6 card-glow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Every college, plotted</h2>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {Object.entries(CLUSTER_COLORS).map(([name, color]) => (
                <span key={name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  {name}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
                Your input
              </span>
            </div>
          </div>
          <ScatterPlot highlight={result ? input : null} />
        </div>
      </section>

      {/* predictor */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 card-glow">
            <h2 className="font-display text-xl font-semibold">Try a prediction</h2>
            <p className="mt-1 text-sm text-muted-foreground">Adjust the sliders — the model scales your input and finds the nearest cluster centroid, exactly like <code className="font-mono text-xs text-primary">KMeans.predict()</code>.</p>
            <div className="mt-6 space-y-5">
              {FEATURES.map((f) => (
                <div key={f.key}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label className="text-sm font-medium">{f.label}</label>
                    <span className="font-mono text-sm text-primary">
                      {f.key === "annualFees" ? formatINR(input[f.key]) : input[f.key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={input[f.key]}
                    onChange={(e) => setInput({ ...input, [f.key]: Number(e.target.value) })}
                    className="w-full accent-[var(--primary)]"
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p>
                </div>
              ))}
              <button
                onClick={predict}
                className="mt-2 w-full rounded-xl bg-primary px-4 py-3 font-display font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Predict college tier
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 card-glow">
            <h2 className="font-display text-xl font-semibold">Result</h2>
            {result ? (
              <div className="animate-float-in">
                <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-secondary p-5">
                  <span className="h-12 w-12 rounded-full" style={{ background: CLUSTER_COLORS[result.category] }} />
                  <div>
                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">cluster {result.clusterId}</p>
                    <p className="font-display text-2xl font-bold">{result.category}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-muted-foreground">Distance to each centroid (scaled space) — nearest wins:</p>
                  {result.distances.map((d, i) => {
                    const name = collegeModel.clusterNames[String(i)];
                    const min = Math.min(...result.distances);
                    return (
                      <div key={i}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className={i === result.clusterId ? "font-semibold" : "text-muted-foreground"}>{name}</span>
                          <span className="font-mono text-muted-foreground">{d.toFixed(3)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(d / Math.max(...result.distances)) * 100}%`, background: name ? CLUSTER_COLORS[name] : undefined, opacity: i === result.clusterId ? 1 : 0.4 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">Your input is also marked on the scatter plot above.</p>
              </div>
            ) : (
              <div className="mt-6 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
                <p className="font-mono text-4xl text-muted-foreground">?</p>
                <p className="mt-3 max-w-xs text-sm text-muted-foreground">Set the five values on the left and hit <span className="text-foreground">Predict college tier</span> to see the model classify it.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center font-mono text-xs text-muted-foreground">
        StandardScaler → KMeans (k=3) · 500 colleges · predictions run locally in your browser
      </footer>
    </div>
  );
}
