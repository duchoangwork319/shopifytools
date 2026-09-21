import columnsConfig from "@/shared/json/columns.json";
import type { ColumnConfig, HeaderConfigEntry } from "@/types/crawl";

const HEADER_CONFIG = columnsConfig as HeaderConfigEntry[];

/**
 * A column's inclusion is forced on when it's `overrideForbidden` (e.g.
 * Handle) or `required` — the user can't exclude it regardless of what
 * `include` says in columns.json or was previously saved.
 */
function isIncludeLocked(field: Pick<HeaderConfigEntry, "overrideForbidden" | "required">): boolean {
  return Boolean(field.overrideForbidden || field.required);
}

/**
 * Default column configuration derived from columns.json — one entry per
 * column, since the Configuration drawer's checkbox for each one directly
 * toggles `include` (whether the column appears in the table/downloaded CSV
 * at all), so every column must be listed to be toggleable.
 */
export function getDefaultColumnConfiguration(): ColumnConfig[] {
  return HEADER_CONFIG.map((field) => ({
    name: field.name,
    include: isIncludeLocked(field) ? true : field.include,
    overrideForbidden: field.overrideForbidden,
    required: field.required,
  }));
}

/**
 * The column names currently included, in columns.json's ordinal order,
 * given a (possibly user-edited) column configuration. This defines the
 * *output* column set for the table/fetch/download — independent of
 * whatever columns happened to be present in the uploaded CSV, so a CSV
 * with only a `Handle` column still fetches and produces every configured
 * column.
 */
export function getIncludedHeaders(columnConfiguration: ColumnConfig[]): string[] {
  return columnConfiguration.filter((field) => field.include).map((field) => field.name);
}

/**
 * Headers marked `showInPreviewDialog: true` in columns.json (e.g. "Body (HTML)"),
 * rendered with a preview trigger in the table instead of raw text.
 */
export function getPreviewDialogHeaderNames(): Set<string> {
  return new Set(HEADER_CONFIG.filter((field) => field.showInPreviewDialog).map((field) => field.name));
}
