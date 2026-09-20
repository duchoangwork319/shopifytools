import columnsConfig from "@/shared/json/columns.json";
import { getByKey, setByKey } from "@/lib/setting";
import type { ColumnConfig, HeaderConfigEntry } from "@/types/crawl";

const STORAGE_KEY = "columnConfiguration";
const HEADER_CONFIG = columnsConfig as HeaderConfigEntry[];

/**
 * Default column configuration derived from columns.json.
 */
export function getDefaultColumnConfiguration(): ColumnConfig[] {
  return HEADER_CONFIG.map((field) => ({
    name: field.name,
    allowOverride: field.overrideDefault,
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

/**
 * Load the user's saved column configuration, filling in defaults for any
 * field that is missing (e.g. added to columns.json after the user saved).
 */
export function loadColumnConfiguration(): ColumnConfig[] {
  const defaults = getDefaultColumnConfiguration();
  const saved = getByKey(STORAGE_KEY) as ColumnConfig[] | undefined;

  if (!saved || !Array.isArray(saved)) {
    return defaults;
  }

  const savedByName = new Map(saved.map((field) => [field.name, field.allowOverride]));
  return defaults.map((field) => ({
    name: field.name,
    allowOverride: savedByName.has(field.name) ? Boolean(savedByName.get(field.name)) : field.allowOverride,
  }));
}

/**
 * Persist the user's column configuration.
 */
export function saveColumnConfiguration(config: ColumnConfig[]): void {
  setByKey(STORAGE_KEY, config);
}
