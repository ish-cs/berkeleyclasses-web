import type { SectionSnapshot } from "@/lib/types";

export default function WaitlistTrend({
  snapshots,
  current,
}: {
  snapshots: SectionSnapshot[];
  current: { open_seats: number; waitlisted: number; capacity: number };
}) {
  if (snapshots.length < 2) {
    return (
      <div className="rounded-lg border border-zinc-900 p-5">
        <h2 className="text-lg font-semibold mb-2">Seat history</h2>
        <p className="text-sm text-zinc-500">
          Not enough snapshots yet — check back in a day or two.
        </p>
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.taken_at - b.taken_at);
  const minT = sorted[0].taken_at;
  const maxT = sorted[sorted.length - 1].taken_at;
  const spanT = Math.max(maxT - minT, 1);
  const allYs = sorted.flatMap((s) => [s.open_seats, s.waitlisted]);
  const maxY = Math.max(...allYs, current.capacity, 1);

  const W = 600;
  const H = 140;
  const PAD = 8;

  const xOf = (t: number) => PAD + ((t - minT) / spanT) * (W - 2 * PAD);
  const yOf = (v: number) => H - PAD - (v / maxY) * (H - 2 * PAD);

  const path = (key: "open_seats" | "waitlisted") =>
    sorted
      .map((s, i) => `${i === 0 ? "M" : "L"}${xOf(s.taken_at).toFixed(1)},${yOf(s[key]).toFixed(1)}`)
      .join(" ");

  // 24h + 7d deltas on open_seats
  const now = sorted[sorted.length - 1];
  const oneDayMs = 86_400_000;
  const find = (deltaMs: number) => {
    const target = now.taken_at - deltaMs;
    let best = sorted[0];
    for (const s of sorted) if (Math.abs(s.taken_at - target) < Math.abs(best.taken_at - target)) best = s;
    return best;
  };
  const d1 = now.open_seats - find(oneDayMs).open_seats;
  const d7 = now.open_seats - find(7 * oneDayMs).open_seats;

  return (
    <div className="rounded-lg border border-zinc-900 p-5">
      <div className="flex items-baseline justify-between mb-3 gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">Seat history</h2>
        <div className="flex gap-4 text-sm">
          <Delta label="24h" v={d1} />
          <Delta label="7d" v={d7} />
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        <path d={path("open_seats")} stroke="#86efac" strokeWidth="2" fill="none" />
        <path d={path("waitlisted")} stroke="#fca5a5" strokeWidth="2" fill="none" strokeDasharray="3 3" />
      </svg>
      <div className="flex gap-4 text-xs mt-2 text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-300 inline-block" /> open seats</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-300 inline-block" /> waitlist</span>
      </div>
    </div>
  );
}

function Delta({ label, v }: { label: string; v: number }) {
  const sign = v > 0 ? "+" : "";
  const tone = v > 0 ? "text-green-400" : v < 0 ? "text-red-400" : "text-zinc-500";
  return (
    <span>
      <span className="text-zinc-500">{label} </span>
      <span className={`font-mono ${tone}`}>{sign}{v}</span>
    </span>
  );
}
