// Deterministic subject → accent color picker. Maps each unique subject name to
// one of 6 palette tokens (--subj-1 through --subj-6) using a stable hash so
// the same subject always lights up with the same tint across pages.
const PALETTE = [
  "var(--subj-1)",
  "var(--subj-2)",
  "var(--subj-3)",
  "var(--subj-4)",
  "var(--subj-5)",
  "var(--subj-6)",
];

export function subjectAccent(name: string | null | undefined): string {
  const s = (name ?? "").trim();
  if (!s) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
