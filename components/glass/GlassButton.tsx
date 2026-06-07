"use client";

import { forwardRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from "react";

type Variant = "glass" | "primary" | "gold" | "ghost";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, CSSProperties> = {
  sm: { padding: "0.4rem 0.9rem", fontSize: "0.875rem" },
  md: { padding: "0.6rem 1.3rem", fontSize: "1rem" },
  lg: { padding: "0.8rem 1.7rem", fontSize: "1.0625rem" },
};

function variantStyles(variant: Variant, hover: boolean): CSSProperties {
  switch (variant) {
    case "primary":
      return {
        background: "linear-gradient(180deg, rgba(74,144,217,0.42), rgba(0,50,98,0.55))",
        color: "#fff",
        borderColor: "rgba(120,180,240,0.5)",
        boxShadow: hover
          ? "var(--glass-edge), var(--glass-glow-blue)"
          : "var(--glass-edge), var(--glass-shadow)",
      };
    case "gold":
      return {
        background: "linear-gradient(180deg, rgba(255,213,107,0.9), rgba(253,181,21,0.95))",
        color: "#3a2c00",
        borderColor: "rgba(255,225,150,0.8)",
        boxShadow: hover
          ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 0 24px -4px rgba(253,181,21,0.6), var(--glass-shadow)"
          : "inset 0 1px 0 rgba(255,255,255,0.5), var(--glass-shadow)",
      };
    case "ghost":
      return {
        background: hover ? "var(--glass-1)" : "transparent",
        color: hover ? "var(--glass-text)" : "var(--glass-text-muted)",
        borderColor: "transparent",
        boxShadow: "none",
      };
    case "glass":
    default:
      return {
        background: hover ? "var(--glass-hover)" : "var(--glass-3)",
        color: "var(--glass-text)",
        borderColor: "var(--glass-border-strong)",
        boxShadow: "var(--glass-edge), var(--glass-shadow)",
      };
  }
}

type Props = {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  style?: CSSProperties;
  className?: string;
  "aria-label"?: string;
};

const GlassButton = forwardRef<HTMLButtonElement, Props>(function GlassButton(
  { variant = "glass", size = "md", disabled, children, onClick, type = "button", style, className, ...rest },
  ref,
) {
  const [h, setH] = useState(false);
  const [p, setP] = useState(false);
  const variantStyle = variantStyles(variant, h);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => {
        setH(false);
        setP(false);
      }}
      onMouseDown={() => setP(true)}
      onMouseUp={() => setP(false)}
      className={className}
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        fontFamily: "var(--font-text)",
        fontWeight: 600,
        letterSpacing: "var(--tracking-text)",
        borderRadius: "var(--r-pill)",
        border: "1px solid",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        whiteSpace: "nowrap",
        lineHeight: 1.1,
        backdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        transform: p ? "scale(0.96)" : "scale(1)",
        transition:
          "transform var(--dur-fast) var(--spring), background var(--dur) var(--spring-soft), box-shadow var(--dur) var(--spring-soft)",
        ...SIZES[size],
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
});

export default GlassButton;
