import { useState } from "react";
import { loadConfiguration, saveConfiguration } from "@/lib/configuration";
import type { AppConfiguration } from "@/types/crawl";

/**
 * Single source of truth for all persisted app configuration — store origin,
 * fetch options, and column override configuration — backed by one
 * localStorage entry (see `lib/configuration.ts`).
 */
export function useConfiguration() {
  const [configuration, setConfigurationState] = useState<AppConfiguration>(() => loadConfiguration());

  const setConfiguration = (next: AppConfiguration) => {
    setConfigurationState(next);
    saveConfiguration(next);
  };

  return { configuration, setConfiguration };
}
