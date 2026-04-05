import { cn } from "@/lib/utils";
import React from "react";

type Align = "start" | "end" | "center" | "stretch" | "baseline";
type Gap   = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Direction the stack collapses:
   * - "vertical"   → stacks vertically on mobile, horizontal on md+
   * - "horizontal" → always horizontal (never collapses)
   * - "vertical-only" → always vertical
   *
   * Default: "vertical" (mobile-first collapse at md)
   */
  direction?: "vertical" | "horizontal" | "vertical-only";
  /** Align items on the cross axis */
  align?: Align;
  /** Gap between items */
  gap?: Gap;
  /** Distribute items along the main axis */
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  children: React.ReactNode;
}

const alignMap: Record<Align, string> = {
  start:    "items-start",
  end:      "items-end",
  center:   "items-center",
  stretch:  "items-stretch",
  baseline: "items-baseline",
};

const justifyMap: Record<string, string> = {
  start:   "justify-start",
  end:     "justify-end",
  center:  "justify-center",
  between: "justify-between",
  around:  "justify-around",
  evenly:  "justify-evenly",
};

/**
 * Stack — a responsive flex container that flips direction at the md breakpoint.
 *
 * By default children are stacked vertically on mobile and laid out
 * horizontally on md+ screens — exactly like Bootstrap's `flex-md-row`.
 *
 * @example
 * // Vertical on mobile → horizontal row on md+
 * <Stack gap={4} align="center">
 *   <Button>Cancel</Button>
 *   <Button variant="default">Save</Button>
 * </Stack>
 *
 * // Always horizontal
 * <Stack direction="horizontal" gap={2}>
 *   <Badge>Draft</Badge>
 *   <Badge>Urgent</Badge>
 * </Stack>
 */
export function Stack({
  direction = "vertical",
  align = "stretch",
  justify = "start",
  gap = 4,
  className,
  children,
  ...props
}: StackProps) {
  const directionClass =
    direction === "vertical"
      ? "flex-col md:flex-row"          // ← collapse point you chose (md)
      : direction === "horizontal"
      ? "flex-row"
      : "flex-col";                     // vertical-only

  return (
    <div
      className={cn(
        "flex",
        directionClass,
        alignMap[align],
        justifyMap[justify],
        `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
