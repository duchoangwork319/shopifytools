export interface SettingsStore {
  [key: string]: unknown;
}

export interface AppSettings {
  storeOrigin?: string;
}

const STORAGE_KEY = 'spf_app_settings';

/**
 * Get all settings from localStorage
 */
export function getAll(): SettingsStore {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get all settings:', error);
    return {};
  }
}

/**
 * Get a setting value by key
 */
export function getByKey(key: string): unknown {
  try {
    const settings = getAll();
    return settings[key];
  } catch (error) {
    console.error(`Failed to get setting for key ${key}:`, error);
    return undefined;
  }
}

/**
 * Set a setting value by key
 */
export function setByKey(key: string, value: unknown): void {
  try {
    const settings = getAll();
    settings[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error(`Failed to set setting for key ${key}:`, error);
  }
}

/**
 * Set all settings, replacing existing ones
 */
export function setAll(settings: SettingsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to set all settings:', error);
  }
}
