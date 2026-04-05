export type CsvCellValue = string | number | boolean | null

export interface CrawlResult {
  handle: string
  json: string
  html: string
  rows: string[][]
}

export type PapaData = Record<string, string>
export interface ShopifyCSVContainer {
  headers: string[]
  data: PapaData[]
  handles: string[]
}