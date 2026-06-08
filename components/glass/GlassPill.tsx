"use client";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { Chip } from "./Chip";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  style?: CSSProperties;
};

export const GlassPill = forwardRef<HTMLButtonElement, Props>(function GlassPill(
  { active, ...rest },
  ref,
) {
  return <Chip ref={ref} selected={active} {...rest} />;
});

export default GlassPill;
