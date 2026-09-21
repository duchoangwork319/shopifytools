export type CsvCellValue = string | number | boolean | null

export interface FetchOptions {
  publishProducts: boolean;
  inventoryPolicyContinue: boolean;
  handleSuffix: string;
  appendTags: string;
}

export type AnyDataRow = Record<string, string>
export interface ShopifyCSVContainer {
  headers: string[]
  data: AnyDataRow[]
  handles: string[]
}

export interface ColumnConfig {
  name: string
  include: boolean
  overrideForbidden?: boolean
  required?: boolean
}

export interface FetchError {
  handle: string
  message: string
}

export interface HeaderConfigEntry {
  name: string
  include: boolean
  overrideForbidden?: boolean
  required?: boolean
  showInPreviewDialog?: boolean
}

export interface AppConfiguration {
  storeOrigin: string
  fetchOptions: FetchOptions
  columnConfiguration: ColumnConfig[]
}

