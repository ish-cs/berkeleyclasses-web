"use client";
import { SeatPill } from "./SeatPill";

type Props = {
  seats: number;
  size?: "sm" | "md" | "lg";
  waitlist?: number;
};

// Thin adapter — Phase 2+ pages migrate to <SeatPill /> directly,
// then this file can be removed.
export function SeatCapsule({ seats, waitlist }: Props) {
  return <SeatPill open={seats} waitlist={waitlist ?? 0} />;
}

export default SeatCapsule;
