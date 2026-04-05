import { cn } from "@/lib/utils";
import React from "react";

type Justify =
  | "start"
  | "end"
  | "center"
  | "between"
  | "around"
  | "evenly";

type Align = "start" | "end" | "center" | "stretch" | "baseline";

type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Justify content along the main (horizontal) axis */
  justify?: Justify;
  /** Align items along the cross (vertical) axis */
  align?: Align;
  /** Gap between children (maps to Tailwind gap-* scale) */
  gap?: Gap;
  /** Allow children to wrap onto multiple lines */
  wrap?: boolean;
  /** Reverse direction */
  reverse?: boolean;
  children: React.ReactNode;
}

const justifyMap: Record<Justify, string> = {
  start:   "justify-start",
  end:     "justify-end",
  center:  "justify-center",
  between: "justify-between",
  around:  "justify-around",
  evenly:  "justify-evenly",
};

const alignMap: Record<Align, string> = {
  start:    "items-start",
  end:      "items-end",
  center:   "items-center",
  stretch:  "items-stretch",
  baseline: "items-baseline",
};

/**
 * Row — a horizontal flex container, analogous to Bootstrap's <div class="row">.
 *
 * @example
 * <Row justify="between" align="center" gap={4}>
 *   <Col span={6}>Left</Col>
 *   <Col span={6}>Right</Col>
 * </Row>
 */
export function Row({
  justify = "start",
  align = "stretch",
  gap = 4,
  wrap = true,
  reverse = false,
  className,
  children,
  ...props
}: RowProps) {
  return (
    <div
      className={cn(
        "flex",
        reverse ? "flex-row-reverse" : "flex-row",
        wrap ? "flex-wrap" : "flex-nowrap",
        justifyMap[justify],
        alignMap[align],
        `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
