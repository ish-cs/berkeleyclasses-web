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
      <>
        <h3>Seat history</h3>
        <div className="bc-trend-empty">
          Not enough snapshots yet — check back in a day or two.
        </div>
      </>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.taken_at - b.taken_at);
  const minT = sorted[0].taken_at;
  const maxT = sorted[sorted.length - 1].taken_at;
  const spanT = Math.max(maxT - minT, 1);
  const allYs = sorted.flatMap((s) => [s.open_seats, s.waitlisted]);
  const maxY = Math.max(...allYs, current.capacity, 1);

  const W = 600;
  const H = 120;
  const PAD = 8;

  const xOf = (t: number) => PAD + ((t - minT) / spanT) * (W - 2 * PAD);
  const yOf = (v: number) => H - PAD - (v / maxY) * (H - 2 * PAD);

  const linePath = sorted
    .map((s, i) => `${i === 0 ? "M" : "L"}${xOf(s.taken_at).toFixed(1)},${yOf(s.open_seats).toFixed(1)}`)
    .join(" ");

  // Close path for fill area
  const firstX = xOf(sorted[0].taken_at).toFixed(1);
  const lastX = xOf(sorted[sorted.length - 1].taken_at).toFixed(1);
  const fillPath = `${linePath} L${lastX},${H} L${firstX},${H} Z`;

  const waitlistPath = sorted
    .map((s, i) => `${i === 0 ? "M" : "L"}${xOf(s.taken_at).toFixed(1)},${yOf(s.waitlisted).toFixed(1)}`)
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
    <>
      <h3 style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Seat history</span>
        <span style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 400 }}>
          <Delta label="24h" v={d1} />
          <Delta label="7d" v={d7} />
        </span>
      </h3>
      <div className="bc-trend">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <path d={fillPath} className="bc-trend-fill" />
          <path d={linePath} className="bc-trend-line" />
          <path d={waitlistPath} stroke="var(--california-gold)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        </svg>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 12, height: 2, background: "var(--berkeley-blue)", borderRadius: 1 }} />
          open seats
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 12, height: 2, background: "var(--california-gold)", borderRadius: 1 }} />
          waitlist
        </span>
      </div>
    </>
  );
}

function Delta({ label, v }: { label: string; v: number }) {
  const sign = v > 0 ? "+" : "";
  const color = v > 0 ? "var(--cap-open-text)" : v < 0 ? "#f87171" : "var(--muted)";
  return (
    <span>
      <span style={{ color: "var(--muted)" }}>{label} </span>
      <span style={{ fontVariantNumeric: "tabular-nums", color }}>{sign}{v}</span>
    </span>
  );
}
