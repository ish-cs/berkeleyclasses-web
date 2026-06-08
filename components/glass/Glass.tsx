import { forwardRef } from "react";
import type { CSSProperties, HTMLAttributes, ElementType } from "react";

type GlassProps<T extends ElementType = "div"> = {
  as?: T;
  spec?: boolean;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style">;

export const Glass = forwardRef<HTMLElement, GlassProps>(function Glass(
  { as, spec = true, className, children, ...rest }, ref
) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag ref={ref} className={["bc-glass", spec ? "bc-glass--spec" : null, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
});
