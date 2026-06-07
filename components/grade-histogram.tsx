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
  const max = Math.max(...ordered.map((d) => d.percentage), 0.0001);

  return (
    <div className="rounded-lg border border-zinc-900 p-5">
      <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">Grade distribution</h2>
        <div className="flex items-baseline gap-4 text-sm">
          {average !== null && (
            <span>
              <span className="text-zinc-500">Avg GPA </span>
              <span className="font-mono font-semibold">{average.toFixed(2)}</span>
            </span>
          )}
          {sampleSize !== null && sampleSize > 0 && (
            <span className="text-zinc-500">{sampleSize.toLocaleString()} grades</span>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {ordered.map((d) => {
          const pct = d.percentage * 100;
          const widthPct = (d.percentage / max) * 100;
          return (
            <div key={d.letter} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-zinc-400 font-mono">{d.letter}</span>
              <div className="flex-1 h-4 bg-zinc-900 rounded overflow-hidden">
                <div
                  className="h-full bg-zinc-100"
                  style={{ width: `${widthPct.toFixed(2)}%` }}
                />
              </div>
              <span className="w-12 text-right text-zinc-500 font-mono">{pct.toFixed(1)}%</span>
              <span className="w-12 text-right text-zinc-600 font-mono hidden sm:inline">{d.count}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-zinc-600 mt-4">Source: Berkeleytime · aggregated across all terms / instructors.</p>
    </div>
  );
}
