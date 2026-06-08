import type { GradeDistEntry } from "@/lib/types";

const ORDER = [
  "A+", "A", "A-",
  "B+", "B", "B-",
  "C+", "C", "C-",
  "D+", "D", "D-",
  "F",
  "P", "NP",
  "S", "U",
];

export default function GradeHistogram({
  distribution,
  average,
  sampleSize,
}: {
  distribution: GradeDistEntry[];
  average: number | null;
  sampleSize: number | null;
}) {
  const byLetter = new Map(distribution.map((d) => [d.letter, d]));
  const ordered = ORDER.map((l) => byLetter.get(l)).filter(Boolean) as GradeDistEntry[];

  if (ordered.length === 0) {
    return <div className="bc-histogram-empty">No grade history.</div>;
  }

  const max = Math.max(...ordered.map((d) => d.percentage), 0.0001);
  const peakIdx = ordered.findIndex((d) => d.percentage === max);

  return (
    <>
      {(average !== null || (sampleSize !== null && sampleSize > 0)) && (
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--muted)", marginBottom: 8, flexWrap: "wrap" }}>
          {average !== null && (
            <span>
              Avg GPA{" "}
              <strong style={{ color: "var(--ink-strong)", fontVariantNumeric: "tabular-nums" }}>
                {average.toFixed(2)}
              </strong>
            </span>
          )}
          {sampleSize !== null && sampleSize > 0 && (
            <span>{sampleSize.toLocaleString()} grades</span>
          )}
        </div>
      )}
      <div className="bc-histogram">
        {ordered.map((d, i) => (
          <div
            key={d.letter}
            className={[
              "bc-histogram-bar",
              i === peakIdx ? "bc-histogram-bar--peak" : null,
            ].filter(Boolean).join(" ")}
            style={{ height: `${(d.percentage / max) * 100}%` }}
            title={`${d.letter}: ${(d.percentage * 100).toFixed(1)}% (${d.count})`}
          />
        ))}
      </div>
      <div className="bc-histogram-labels">
        {ordered.map((d) => <span key={d.letter}>{d.letter}</span>)}
      </div>
      <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8 }}>
        Source: Berkeleytime · aggregated across all terms / instructors.
      </p>
    </>
  );
}
