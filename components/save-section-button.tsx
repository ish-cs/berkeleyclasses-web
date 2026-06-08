"use client";
import { StarButton } from "@/components/glass";

type Props = { ccn: string; initial?: boolean };

export function SaveSectionButton({ ccn, initial = false }: Props) {
  return (
    <StarButton
      initial={initial}
      label={`Save section ${ccn}`}
      onToggle={async (next) => {
        try {
          const res = await fetch("/api/save-section", {
            method: next ? "POST" : "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ccn }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            console.error("save-section failed", res.status, j);
            if (res.status === 401) location.href = "/auth/signin";
          }
        } catch (e) {
          console.error("save-section network error", e);
        }
      }}
    />
  );
}
