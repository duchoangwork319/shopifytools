import { getDefaultColumnConfiguration } from "@/lib/column-configuration";
import type { AppConfiguration, ColumnConfig, FetchOptions } from "@/types/crawl";

const STORAGE_KEY = "spf_app_settings";

function getDefaultFetchOptions(): FetchOptions {
  return {
    publishProducts: false,
    inventoryPolicyContinue: false,
    handleSuffix: "",
    appendTags: "",
  };
}

function getDefaultConfiguration(): AppConfiguration {
  return {
    storeOrigin: "",
    fetchOptions: getDefaultFetchOptions(),
    columnConfiguration: getDefaultColumnConfiguration(),
  };
}

/**
 * Fill in defaults for any column missing from a saved configuration (e.g.
 * a column added to columns.json after the user last saved).
 */
function mergeColumnConfiguration(defaults: ColumnConfig[], saved: unknown): ColumnConfig[] {
  if (!Array.isArray(saved)) return defaults;

  const savedByName = new Map(
    saved
      .filter((field): field is ColumnConfig => typeof field?.name === "string")
      .map((field) => [field.name, field.allowOverride])
  );

  return defaults.map((field) => ({
    ...field,
    // overrideForbidden always wins, even over a stale saved value — the
    // user was never able to opt this column in in the first place.
    allowOverride: field.overrideForbidden
      ? false
      : savedByName.has(field.name) ? Boolean(savedByName.get(field.name)) : field.allowOverride,
  }));
}

/**
 * Load the full app configuration (store origin, fetch options, column
 * configuration) from a single localStorage entry, filling in defaults for
 * anything missing or malformed.
 */
export function loadConfiguration(): AppConfiguration {
  const defaults = getDefaultConfiguration();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Partial<AppConfiguration>;

    return {
      storeOrigin: typeof parsed.storeOrigin === "string" ? parsed.storeOrigin : defaults.storeOrigin,
      fetchOptions: { ...defaults.fetchOptions, ...(parsed.fetchOptions ?? {}) },
      columnConfiguration: mergeColumnConfiguration(defaults.columnConfiguration, parsed.columnConfiguration),
    };
  } catch (error) {
    console.error("Failed to load configuration:", error);
    return defaults;
  }
}

/**
 * Persist the full app configuration.
 */
export function saveConfiguration(configuration: AppConfiguration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configuration));
  } catch (error) {
    console.error("Failed to save configuration:", error);
  }
}
