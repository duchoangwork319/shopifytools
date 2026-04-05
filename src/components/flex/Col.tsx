import { cn } from "@/lib/utils";
import React from "react";

type ColSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto";

interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns to span (out of 12) at all breakpoints */
  span?: ColSpan;
  /** Column span at sm breakpoint (≥640px) */
  sm?: ColSpan;
  /** Column span at md breakpoint (≥768px) */
  md?: ColSpan;
  /** Column span at lg breakpoint (≥1024px) */
  lg?: ColSpan;
  /** Column span at xl breakpoint (≥1280px) */
  xl?: ColSpan;
  children?: React.ReactNode;
}

/** Maps a span number to the correct Tailwind class. */
function spanClass(span: ColSpan, prefix = ""): string {
  if (span === "auto") return `${prefix}w-auto`;

  const fractions: Record<number, string> = {
    1:  "1/12",
    2:  "1/6",
    3:  "1/4",
    4:  "1/3",
    5:  "5/12",
    6:  "1/2",
    7:  "7/12",
    8:  "2/3",
    9:  "3/4",
    10: "5/6",
    11: "11/12",
    12: "full",
  };

  return `${prefix}w-${fractions[span]}`;
}

/**
 * Col — a flex child that understands a 12-column grid.
 * Spans are expressed as column counts (1–12) and translated to
 * Tailwind width fractions so no custom CSS is needed.
 *
 * @example
 * // Full-width on mobile, half on md+
 * <Col span={12} md={6}>…</Col>
 *
 * // Sidebar / main layout
 * <Col span={12} md={3}>Sidebar</Col>
 * <Col span={12} md={9}>Main</Col>
 */
export function Col({
  span,
  sm,
  md,
  lg,
  xl,
  className,
  children,
  ...props
}: ColProps) {
  return (
    <div
      className={cn(
        // Base: full width if no span given (mobile-first)
        span ? spanClass(span)         : "w-full",
        sm  ? spanClass(sm,  "sm:")   : "",
        md  ? spanClass(md,  "md:")   : "",
        lg  ? spanClass(lg,  "lg:")   : "",
        xl  ? spanClass(xl,  "xl:")   : "",
        // Shrink/grow only when a finite span is set
        span !== "auto" && "min-w-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
