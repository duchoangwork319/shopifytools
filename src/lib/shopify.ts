import { buildMainMap } from "@/shared/csv/mapping"
import { createProductCsvRowsWithMap } from "@/shared/csv/rows"
import type { CrawlResult } from "@/types/crawl"
import type { ShopifyProduct } from "@/types/shopify"
import csvConfig from "@/shared/json/config.json"
import headerConfig from "@/shared/json/header.json"

type CsvHeader = (typeof headerConfig.headers)[number]

const HEADERS = headerConfig.headers as CsvHeader[]

export function getCsvHeaders() {
  return HEADERS
}

export function buildProductUrl(storeOrigin: string, handle: string) {
  const base = storeOrigin.replace(/\/+$/u, "")
  return `${base}/products/${handle}`
}

export function sanityHtml(html: string) {
  const imgRegex = /<img\b[^>]*>/gi;
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  const linkRegex = /<link\b[^>]*>/gi;
  const videoRegex = /<video\b[^>]*>([\s\S]*?)<\/video>/gi;
  const audioRegex = /<audio\b[^>]*>([\s\S]*?)<\/audio>/gi;
  const iframeRegex = /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi;
  const embedRegex = /<embed\b[^>]*>([\s\S]*?)<\/embed>/gi;
  const objectRegex = /<object\b[^>]*>([\s\S]*?)<\/object>/gi;
  const noscriptRegex = /<noscript\b[^>]*>([\s\S]*?)<\/noscript>/gi;
  const pictureRegex = /<picture\b[^>]*>([\s\S]*?)<\/picture>/gi;
  const sourceRegex = /<source\b[^>]*>/gi;
  const regexGroup = [imgRegex, scriptRegex, styleRegex, linkRegex, videoRegex, audioRegex, iframeRegex, embedRegex, objectRegex, noscriptRegex, pictureRegex, sourceRegex];
  let cleanedHtml = html;
  regexGroup.forEach((regex) => {
    cleanedHtml = cleanedHtml.replace(regex, "");
  });
  const doc = new DOMParser().parseFromString(cleanedHtml, "text/html")
  return doc
}

export async function crawlHandle(
  handle: string,
  storeOrigin: string,
  headers: string[]
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
  const htmlDocument = sanityHtml(html)
  const mainMap = buildMainMap(headers || getCsvHeaders());
  const options = {
    product: product,
    html: htmlDocument,
    mainMap,
    csvConfig: csvConfig,
    valuesOnly: true,
  };
  console.log("Create CSV rows with options:", options);
  const { rows } = createProductCsvRowsWithMap(options);

  // localStorage.setItem(`spf_${handle}_json`, json)
  // localStorage.setItem(`spf_${handle}_html`, html)

  return { handle, json, html, rows }
}
