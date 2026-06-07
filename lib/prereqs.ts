// Best-effort prereq extraction. Prefer course_meta.prereq_text when present,
// otherwise fall back to parsing the section description.
export function extractPrereqs(args: {
  metaText?: string | null;
  requiredCourses?: { subject: string; number: string }[] | null;
  description?: string | null;
}): { text: string | null; courses: { subject: string; number: string }[] } {
  const courses = (args.requiredCourses ?? []).map((c) => ({
    subject: c.subject,
    number: c.number,
  }));

  if (args.metaText && args.metaText.trim().length > 0) {
    return { text: cleanText(args.metaText), courses };
  }

  if (args.description) {
    const m = args.description.match(/Prerequisites?:\s*([^.]+(?:\.[^A-Z][^.]+)*\.?)/i);
    if (m) return { text: cleanText(m[1]), courses };
  }
  return { text: null, courses };
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/^\.\s*/, "");
}
