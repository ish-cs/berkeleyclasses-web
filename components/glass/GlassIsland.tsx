import type { CSSProperties, ReactNode } from "react";
import { Glass } from "./Glass";

type Props = {
  children: ReactNode;
  visible?: boolean;
  style?: CSSProperties;
};

export function GlassIsland({ children, visible = true, style }: Props) {
  return (
    <Glass
      className="bc-island"
      style={{
        transform: visible ? "translate(-50%, 0)" : "translate(-50%, 160%)",
        ...style,
      }}
    >
      {children}
    </Glass>
  );
}

export default GlassIsland;
