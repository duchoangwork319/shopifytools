import { buildMainMap } from "@/shared/csv/mapping";
import { createProductCsvRowsWithMap } from "@/shared/csv/rows";
import type { AnyDataRow, FetchOptions } from "@/types/crawl";
import type { ShopifyProduct } from "@/types/shopify";
import csvConfig from "@/shared/json/config.json";

export function buildProductUrl(storeOrigin: string, handle: string) {
  const base = storeOrigin.replace(/\/+$/u, "");
  return `${base}/products/${handle}`;
}

export function cleanConfusables(str: string) {
  const map: Record<string, string> = {
    '\u2013': '-', // En dash
    '\u2014': '-', // Em dash
    '\u2018': "'", // Left single quote
    '\u2019': "'", // Right single quote
    '\u201c': '"', // Left double quote
    '\u201d': '"', // Right double quote
  };
  return str.replace(/[\u2013\u2014\u2018\u2019\u201c\u201d]/g, m => map[m]);
}

export function sanityHtml(html: string) {
  const imgRegex = /<img[^>]*>/gi;
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const linkRegex = /<link[^>]*>/gi;
  const videoRegex = /<video[^>]*>([\s\S]*?)<\/video>/gi;
  const audioRegex = /<audio[^>]*>([\s\S]*?)<\/audio>/gi;
  const iframeRegex = /<iframe[^>]*>([\s\S]*?)<\/iframe>/gi;
  const embedRegex = /<embed[^>]*>([\s\S]*?)<\/embed>/gi;
  const objectRegex = /<object[^>]*>([\s\S]*?)<\/object>/gi;
  const noscriptRegex = /<noscript[^>]*>([\s\S]*?)<\/noscript>/gi;
  const pictureRegex = /<picture[^>]*>([\s\S]*?)<\/picture>/gi;
  const sourceRegex = /<source[^>]*>/gi;
  const regexGroup = [imgRegex, scriptRegex, styleRegex, linkRegex, videoRegex, audioRegex, iframeRegex, embedRegex, objectRegex, noscriptRegex, pictureRegex, sourceRegex];
  let cleanedHtml = cleanConfusables(html);
  regexGroup.forEach((regex) => {
    cleanedHtml = cleanedHtml.replace(regex, "");
  });
  const doc = new DOMParser().parseFromString(cleanedHtml, "text/html");
  return doc;
}

export interface FetchedProduct {
  handle: string
  json: string
  html: string
  product: ShopifyProduct
  htmlDocument: Document
}

/**
 * Fetch a product's JSON and HTML from the storefront. Pure I/O — no CSV row
 * building here, so this can be reused wherever the raw product is needed.
 */
export async function fetchProduct(handle: string, storeOrigin: string): Promise<FetchedProduct> {
  const productUrl = buildProductUrl(storeOrigin, handle);
  const [jsonResponse, htmlResponse] = await Promise.all([
    fetch(`${productUrl}.js`),
    fetch(productUrl),
  ]);

  if (!jsonResponse.ok) {
    throw new Error(`Failed to fetch ${handle}.js (${jsonResponse.status})`);
  }

  if (!htmlResponse.ok) {
    throw new Error(`Failed to fetch ${handle} HTML (${htmlResponse.status})`);
  }

  const json = await jsonResponse.text();
  const html = await htmlResponse.text();
  const product = JSON.parse(json) as ShopifyProduct;
  const htmlDocument = sanityHtml(html);

  return { handle, json, html, product, htmlDocument };
}

/**
 * Build CSV rows (as header-keyed objects, matching `ShopifyCSVContainer`) from
 * an already-fetched product. Pure data transform — no network I/O.
 */
export function buildProductData(
  fetched: FetchedProduct,
  headers: string[],
  options: FetchOptions
): { rows: AnyDataRow[] } {
  const mainMap = buildMainMap(headers);
  const finalOptions = {
    product: fetched.product,
    html: fetched.htmlDocument,
    mainMap,
    csvConfig: csvConfig.csv || {},
    valuesOnly: false,
    transformOption: options
  };
  const { rows } = createProductCsvRowsWithMap(finalOptions);

  return { rows: rows as unknown as AnyDataRow[] };
}
