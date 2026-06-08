import type { SectionSnapshot } from "@/lib/types";

export default function WaitlistTrend({
  snapshots,
  current,
}: {
  snapshots: SectionSnapshot[];
  current: { open_seats: number; waitlisted: number; capacity: number };
}) {
  const ONE_DAY_SEC = 86_400;
  const sorted = [...snapshots].sort((a, b) => a.taken_at - b.taken_at);
  const minT = sorted.length > 0 ? sorted[0].taken_at : 0;
  const maxT = sorted.length > 0 ? sorted[sorted.length - 1].taken_at : 0;
  const spanSec = maxT - minT;

  if (snapshots.length < 2 || spanSec < ONE_DAY_SEC) {
    return (
      <>
        <h3>Seat history</h3>
        <div className="bc-trend-empty">
          Collecting data — check back in a day or two for a meaningful trend.
        </div>
      </>
    );
  }

  const spanT = Math.max(spanSec, 1);
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

  // 24h + 7d deltas on open_seats (taken_at is unix seconds)
  const now = sorted[sorted.length - 1];
  const find = (deltaSec: number) => {
    const target = now.taken_at - deltaSec;
    let best = sorted[0];
    for (const s of sorted) if (Math.abs(s.taken_at - target) < Math.abs(best.taken_at - target)) best = s;
    return best;
  };
  const has1d = spanSec >= ONE_DAY_SEC;
  const has7d = spanSec >= 7 * ONE_DAY_SEC;
  const d1 = has1d ? now.open_seats - find(ONE_DAY_SEC).open_seats : null;
  const d7 = has7d ? now.open_seats - find(7 * ONE_DAY_SEC).open_seats : null;

  return (
    <>
      <h3 style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Seat history</span>
        <span style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 400 }}>
          {d1 != null && <Delta label="24h" v={d1} />}
          {d7 != null && <Delta label="7d" v={d7} />}
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
  const color = v > 0 ? "var(--berkeley-blue)" : v < 0 ? "#dc2626" : "var(--muted)";
  return (
    <span>
      <span style={{ color: "var(--muted)" }}>{label} </span>
      <span style={{ fontVariantNumeric: "tabular-nums", color }}>{sign}{v}</span>
    </span>
  );
}
