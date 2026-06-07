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

// Berkeley's "Summer Sessions YYYY" parent has sub-session codes ("A: 6 week
// May 21-June 29", "12W: Week May 20-Aug. 9", etc.) whose term_ids are
// allocated immediately after the parent's term_id. We use that ordering to
// fold them into a hierarchical view.
export type TermGroup =
  | { kind: "single"; term: TermLike }
  | { kind: "summer"; parent: TermLike; children: TermLike[] };

function termIdNum(t: TermLike): number {
  return Number.parseInt(t.term_id, 10);
}

function isSummerParent(name: string): boolean {
  return /^Summer Sessions? \d{4}$/i.test(name);
}

function isAcademicTerm(name: string): boolean {
  return /^(Fall|Spring|Winter)\s+\d{4}$/i.test(name) || isSummerParent(name);
}

// Build a year-sorted hierarchy: real terms in order (Fall > Summer parent w/
// children > Spring), Summer codes nested under their year's parent, any
// truly orphaned session codes grouped at the end.
export function groupTermsByYear<T extends TermLike>(terms: T[]): TermGroup[] {
  // Walk by term_id ASC to attach session codes to their preceding parent.
  const byId = [...terms].sort((a, b) => termIdNum(a) - termIdNum(b));

  let currentSummer: { parent: T; children: T[] } | null = null;
  const summerByName = new Map<string, { parent: T; children: T[] }>();
  const academics: T[] = [];

  for (const t of byId) {
    if (isSummerParent(t.name)) {
      currentSummer = { parent: t, children: [] };
      summerByName.set(t.name, currentSummer);
      academics.push(t);
      continue;
    }
    if (isAcademicTerm(t.name)) {
      academics.push(t);
      currentSummer = null;
      continue;
    }
    // session code; attach to nearest preceding summer parent
    if (currentSummer) currentSummer.children.push(t);
  }

  // Sort academics by year DESC + season; then build groups
  const orderedAcademics = sortTermsByYear(academics);
  const groups: TermGroup[] = orderedAcademics.map((t) => {
    if (isSummerParent(t.name)) {
      const grp = summerByName.get(t.name);
      if (grp) {
        // Sort children alphabetically by short code (A:, B:, 12W:, etc.)
        const sortedChildren = [...grp.children].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        return { kind: "summer", parent: t, children: sortedChildren };
      }
    }
    return { kind: "single", term: t };
  });

  return groups;
}

// Resolve a selected term NAME (from the URL) to one or more term_ids the
// query should match. Picking "Summer Sessions YYYY" expands to that parent
// plus all its sub-session codes; picking any other name resolves to that
// single row.
export function resolveTermIds(
  allTerms: TermLike[],
  selectedName: string,
): string[] {
  const name = selectedName.trim();
  if (!name) return [];
  const direct = allTerms.find((t) => t.name === name);

  if (direct && isSummerParent(direct.name)) {
    const groups = groupTermsByYear(allTerms);
    for (const g of groups) {
      if (g.kind === "summer" && g.parent.term_id === direct.term_id) {
        return [g.parent.term_id, ...g.children.map((c) => c.term_id)];
      }
    }
  }
  return direct ? [direct.term_id] : [];
}
