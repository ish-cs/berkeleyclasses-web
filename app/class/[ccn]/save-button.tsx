"use client";
import { StarButton } from "@/components/glass";

// TODO(Phase 4.5): wire persistence via /api/save-section once saved_sections table + endpoint exist.
// For now the star is visual-only — toggle state is ephemeral (in-component useState via StarButton).
export function SaveSectionButton({ ccn, initial = false }: { ccn: number; initial?: boolean }) {
  return (
    <StarButton
      initial={initial}
      label={`Save section ${ccn}`}
      onToggle={(_next) => {
        // no-op until backend endpoint is ready
      }}
    />
  );
}
