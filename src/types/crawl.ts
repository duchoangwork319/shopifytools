export type CsvCellValue = string | number | boolean | null

export type ProductCsvRow = CsvCellValue[]

export interface CrawlResult {
  handle: string
  json: string
  html: string
  rows: ProductCsvRow[]
}

export interface ProductTableObject {
  handle: string,
  rows: ProductCsvRow[]
}

export type ProductRecordMap = Map<string, ProductTableObject>
