"use strict";

import { buildMainMap, mapRow } from "./mapping.js";
import { createDerivedProductData } from "./product.js";

/**
 * Build product CSV rows using the same master -> variants -> media flow as toCsv.js.
 * @param {Object} params - Row generation options
 * @param {Object} params.product - Product JSON data
 * @param {import("cheerio").CheerioAPI|null|undefined} [params.html] - Cheerio API instance
 * @param {string[]} params.headers - CSV headers
 * @param {Object} [params.csvConfig] - CSV config with tag groups
 * @returns {{ rows: Array[], counters: { products: number, variants: number }, mainMap: Array }}
 */
export function createProductCsvRows({ product, html = null, headers = [], csvConfig = {} }) {
  const mainMap = buildMainMap(headers);
  return createProductCsvRowsWithMap({ product, html, mainMap, csvConfig });
}

/**
 * Build product CSV rows from a precomputed mapping table.
 * @param {Object} params - Row generation options
 * @param {Object} params.product - Product JSON data
 * @param {import("cheerio").CheerioAPI|null|undefined} [params.html] - Cheerio API instance
 * @param {{ header: string, map: Function }[]} params.mainMap - Header mapper definitions
 * @param {Object} [params.csvConfig] - CSV config with tag groups
 * @param {boolean} [params.valuesOnly] - Append values only
 * @returns {{ rows: Array[], counters: { products: number, variants: number } }}
 */
export function createProductCsvRowsWithMap({
  product,
  html = null,
  mainMap = [],
  csvConfig = {},
  valuesOnly
}) {
  const rows = [];
  const counters = { products: 0, variants: 0 };
  const mediaItems = Array.isArray(product?.media) ? product.media : [];
  const mediaIterator = mediaItems.values();
  const masterData = createDerivedProductData(product, html, csvConfig);

  masterData._media = mediaIterator.next().value;
  rows.push(mapRow(mainMap, masterData, { isMaster: true, isMediaOnly: false, valuesOnly }));
  counters.products += 1;

  const variants = Array.isArray(product?.variants) ? product.variants.slice(1) : [];
  for (const variant of variants) {
    masterData._variant = variant;
    masterData._media = mediaIterator.next().value;
    rows.push(mapRow(mainMap, masterData, { isMaster: false, isMediaOnly: false, valuesOnly }));
    counters.variants += 1;
  }

  for (const media of mediaIterator) {
    rows.push(mapRow(mainMap, {
      handle: masterData.handle,
      _media: media
    }, { isMaster: false, isMediaOnly: true, valuesOnly }));
  }

  return { rows, counters };
}
