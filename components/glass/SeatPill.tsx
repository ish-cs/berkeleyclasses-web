type Props = { open: number; waitlist?: number };

export function SeatPill({ open, waitlist = 0 }: Props) {
  const isFull = open === 0;
  return (
    <span className={["bc-seats", isFull ? "bc-seats--full" : null].filter(Boolean).join(" ")}>
      <span className="bc-seats-led" aria-hidden />
      {isFull ? `Waitlist ${waitlist}` : `${open} open`}
    </span>
  );
}
