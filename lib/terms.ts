// Berkeley term names mix real terms ("Fall 2026", "Spring 2026", "Summer
// Sessions 2026") with session sub-codes ("12W: Week May 20-Aug. 9", "A: 6 week
// May 21-June 29", etc.). Sort:
//   1. Real terms first (Fall > Summer > Spring within the same year)
//   2. Most recent year first
//   3. Session sub-codes after, alphabetical
const SEASON_RANK: Record<string, number> = {
  fall: 0,
  summer: 1,
  spring: 2,
  winter: 3,
};

type TermLike = { term_id: string; name: string };

function parseTerm(name: string): { year: number | null; seasonRank: number | null } {
  const m = name.match(/^(Fall|Spring|Summer|Winter)(?:\s+Sessions?)?\s+(\d{4})$/i);
  if (!m) return { year: null, seasonRank: null };
  return { year: parseInt(m[2], 10), seasonRank: SEASON_RANK[m[1].toLowerCase()] ?? 99 };
}

export function sortTermsByYear<T extends TermLike>(terms: T[]): T[] {
  return [...terms].sort((a, b) => {
    const pa = parseTerm(a.name);
    const pb = parseTerm(b.name);
    const aReal = pa.year !== null;
    const bReal = pb.year !== null;
    if (aReal && !bReal) return -1;
    if (bReal && !aReal) return 1;
    if (aReal && bReal) {
      if (pa.year !== pb.year) return (pb.year ?? 0) - (pa.year ?? 0);
      return (pa.seasonRank ?? 99) - (pb.seasonRank ?? 99);
    }
    return a.name.localeCompare(b.name);
  });
}

export function isRealTerm(name: string): boolean {
  return parseTerm(name).year !== null;
}
