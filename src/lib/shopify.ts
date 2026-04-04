import { buildMainMap } from "@/shared/csv/mapping"
import { createProductCsvRowsWithMap } from "@/shared/csv/rows"
import csvConfig from "@/shared/json/config.json"
import headerConfig from "@/shared/json/header.json"
import type { CrawlResult } from "@/types/crawl"
import type {
  ShopifyProduct,
  // ShopifyProductMedia,
  // ShopifyProductVariant,
} from "@/types/shopify"

type CsvHeader = (typeof headerConfig.headers)[number]

const HEADERS = headerConfig.headers as CsvHeader[]

export function getCsvHeaders() {
  return HEADERS
}

export function normalizeHandle(value: string) {
  if (!value) return ""

  try {
    const url = new URL(value)
    const parts = url.pathname.split("/").filter(Boolean)
    const productsIndex = parts.findIndex((part) => part === "products")
    if (productsIndex >= 0 && parts[productsIndex + 1]) {
      return parts[productsIndex + 1].replace(/\.js$/u, "")
    }
  } catch {
    return value
      .replace(/^\/+|\/+$/gu, "")
      .replace(/^products\//u, "")
      .replace(/\.js$/u, "")
      .replace(/[?#].*$/u, "")
  }

  return value
}

export function extractHandles(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\s,]+/u)
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeHandle),
    ),
  ).filter(Boolean)
}

export function inferStoreOrigin(input: string) {
  const tokens = input.split(/[\s,]+/u).map((value) => value.trim())
  for (const token of tokens) {
    try {
      const url = new URL(token)
      return url.origin
    } catch {
      continue
    }
  }

  return ""
}

export function buildProductUrl(storeOrigin: string, handle: string) {
  const base = storeOrigin.replace(/\/+$/u, "")
  return `${base}/products/${handle}`
}

export async function crawlHandle(
  handle: string,
  storeOrigin: string,
): Promise<CrawlResult> {
  const productUrl = buildProductUrl(storeOrigin, handle)
  const [jsonResponse, htmlResponse] = await Promise.all([
    fetch(`${productUrl}.js`),
    fetch(productUrl),
  ])

  if (!jsonResponse.ok) {
    throw new Error(`Failed to fetch ${handle}.js (${jsonResponse.status})`)
  }

  if (!htmlResponse.ok) {
    throw new Error(`Failed to fetch ${handle} HTML (${htmlResponse.status})`)
  }

  const json = await jsonResponse.text()
  const html = await htmlResponse.text()
  const product = JSON.parse(json) as ShopifyProduct
  const htmlDocument = new DOMParser().parseFromString(html, "text/html")
  const mainMap = buildMainMap(getCsvHeaders());

  const { rows } = createProductCsvRowsWithMap({
    product: product,
    html: htmlDocument,
    mainMap,
    csvConfig: csvConfig
  });

  localStorage.setItem(`spf_${handle}_json`, json)
  localStorage.setItem(`spf_${handle}_html`, html)

  return { handle, json, html, rows }
}
