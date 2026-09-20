import columnsConfig from "@/shared/json/columns.json";
import type { ColumnConfig, HeaderConfigEntry } from "@/types/crawl";

const HEADER_CONFIG = columnsConfig as HeaderConfigEntry[];

/**
 * Default column configuration derived from columns.json — one entry per
 * column the user can actually see and configure overriding for.
 *
 * Excluded columns (`exclude: true`) are left out entirely: they never
 * appear in the table or the exported CSV, so there's nothing to configure
 * an override for. This is distinct from `overrideForbidden`, which still
 * shows the column (read-only) since it's visible in the table, just not
 * user-toggleable.
 */
export function getDefaultColumnConfiguration(): ColumnConfig[] {
  return HEADER_CONFIG.filter((field) => !field.exclude).map((field) => ({
    name: field.name,
    // A column that's override-forbidden must always keep the origin CSV
    // value — the user can't opt in, so its checkbox is forced off
    // regardless of overrideDefault.
    allowOverride: field.overrideForbidden ? false : field.overrideDefault,
    overrideForbidden: field.overrideForbidden,
  }));
}

/**
 * Filter out headers marked `exclude: true` in columns.json.
 */
export function excludeHeaders(headers: string[]): string[] {
  const excludedNames = new Set(
    HEADER_CONFIG.filter((field) => field.exclude).map((field) => field.name)
  );
  return headers.filter((header) => !excludedNames.has(header));
}

/**
 * Headers marked `showInPreviewDialog: true` in columns.json (e.g. "Body (HTML)"),
 * rendered with a preview trigger in the table instead of raw text.
 */
export function getPreviewDialogHeaderNames(): Set<string> {
  return new Set(HEADER_CONFIG.filter((field) => field.showInPreviewDialog).map((field) => field.name));
}
