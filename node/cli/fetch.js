"use strict";

import { existsSync, readFileSync } from "fs";
import path from "path";
import fetch from "node-fetch";
import Papa from "papaparse";
import * as cheerio from "cheerio";
import { createArrayCsvWriter } from "csv-writer";
import columnsConfig from "../../src/shared/json/columns.json" with { type: "json" };
import csvConfig from "../../src/shared/json/config.json" with { type: "json" };
import { buildMainMap } from "../../src/shared/csv/mapping.js";
import { createProductCsvRowsWithMap } from "../../src/shared/csv/rows.js";
import { sanityHtml } from "../../src/shared/util.js";

const SLEEP_MS_DURING_FETCH = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Column names currently included per columns.json — mirrors the web app's
 * default column configuration (the CLI has no saved user configuration).
 */
function getIncludedHeaders() {
  return columnsConfig.filter((field) => field.include).map((field) => field.name);
}

/**
 * Column names marked `overrideForbidden` in columns.json (e.g. Handle) —
 * these always keep the origin CSV's value and are never overwritten by
 * fetched data.
 */
function getOverrideForbiddenHeaders() {
  return new Set(columnsConfig.filter((field) => field.overrideForbidden).map((field) => field.name));
}

/**
 * Header list for `--only`: overrideForbidden and required columns are
 * always included (they can't be excluded in the web app either), plus
 * whichever column names the user explicitly asked for. Order follows
 * columns.json's ordinal order.
 * @param {string[]} onlyNames - Column names requested via --only
 * @returns {string[]}
 */
function getOnlyHeaders(onlyNames) {
  const onlySet = new Set(onlyNames.map((name) => name.trim()).filter(Boolean));
  return columnsConfig
    .filter((field) => field.overrideForbidden || field.required || onlySet.has(field.name))
    .map((field) => field.name);
}

/**
 * Read and parse the origin CSV file.
 * @param {string} csvPath - Path to the origin CSV file
 * @returns {{ data: Object[], handles: string[] }}
 */
function readOriginCsv(csvPath) {
  const content = readFileSync(csvPath, "utf8");
  const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });
  const handles = Array.from(new Set(data.map((row) => row.Handle).filter(Boolean)));
  return { data, handles };
}

function buildProductUrl(storeOrigin, handle) {
  const base = storeOrigin.replace(/\/+$/u, "");
  return `${base}/products/${handle}`;
}

/**
 * Fetch a product's JSON and HTML from the storefront over the network.
 * @param {string} handle - Product handle
 * @param {string} storeOrigin - Store origin URL
 * @returns {Promise<{ handle: string, product: Object, htmlDocument: import("cheerio").CheerioAPI }>}
 */
async function fetchProductRemote(handle, storeOrigin) {
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
  const product = JSON.parse(json);
  const htmlDocument = cheerio.load(sanityHtml(html) || "");

  return { handle, product, htmlDocument };
}

/**
 * Read a product's JSON and HTML from a local folder previously downloaded
 * by the `sitemap` command (one `<handle>.json` + `<handle>.html` pair per
 * product). Pure disk I/O — no network involved.
 * @param {string} handle - Product handle
 * @param {string} sourceDir - Local product data folder
 * @returns {{ handle: string, product: Object, htmlDocument: import("cheerio").CheerioAPI }}
 */
function readProductLocal(handle, sourceDir) {
  const jsonPath = path.join(sourceDir, `${handle}.json`);
  const htmlPath = path.join(sourceDir, `${handle}.html`);

  if (!existsSync(jsonPath)) {
    throw new Error(`Local product JSON not found: ${jsonPath}`);
  }
  if (!existsSync(htmlPath)) {
    throw new Error(`Local product HTML not found: ${htmlPath}`);
  }

  const product = JSON.parse(readFileSync(jsonPath, "utf8"));
  const html = readFileSync(htmlPath, "utf8");
  const htmlDocument = cheerio.load(sanityHtml(html) || "");

  return { handle, product, htmlDocument };
}

/**
 * Build CSV rows (as header-keyed objects) from an already-fetched product.
 * Pure data transform — no I/O.
 */
function buildProductData(fetched, headers, options) {
  const mainMap = buildMainMap(headers);
  const finalOptions = {
    product: fetched.product,
    html: fetched.htmlDocument,
    mainMap,
    csvConfig: csvConfig.csv || {},
    valuesOnly: false,
    transformOption: options,
  };
  const { rows } = createProductCsvRowsWithMap(finalOptions);
  return rows;
}

/**
 * Group row indices by their Handle value, preserving first-seen order.
 */
function groupByHandle(rows) {
  const groups = new Map();
  rows.forEach((row, index) => {
    const handle = row.Handle || "";
    const bucket = groups.get(handle);
    if (bucket) {
      bucket.push(index);
    } else {
      groups.set(handle, [index]);
    }
  });
  return groups;
}

/**
 * Merge one product's origin CSV rows with its freshly fetched rows,
 * mirroring the web app's `mergeOriginWithOutput`: every included column
 * always takes the fetched value (even if empty), except `overrideForbidden`
 * columns, which always keep the origin value. Scoped to a single handle so
 * each product's rows can be merged and written immediately, rather than
 * accumulating every product's rows in memory before merging/writing.
 */
function mergeHandleRows(originRows, outputRows, headers, overrideForbiddenHeaders) {
  const merged = [];

  originRows.forEach((originRow, position) => {
    const outputRow = outputRows[position];

    if (!outputRow) {
      merged.push(headers.map((header) => originRow[header] ?? ""));
      return;
    }

    merged.push(headers.map((header) =>
      overrideForbiddenHeaders.has(header) ? (originRow[header] ?? "") : (outputRow[header] ?? "")
    ));
  });

  if (outputRows.length > originRows.length) {
    for (let i = originRows.length; i < outputRows.length; i++) {
      merged.push(headers.map((header) => outputRows[i][header] ?? ""));
    }
  }

  return merged;
}

async function processFetch(originCsvPath, options) {
  const { data: originData, handles } = readOriginCsv(originCsvPath);
  const headers = options.only ? getOnlyHeaders(options.only) : getIncludedHeaders();
  const overrideForbiddenHeaders = getOverrideForbiddenHeaders();
  const originGroups = groupByHandle(originData);

  // --local-source takes priority over --store-origin when both are set.
  const usingLocalSource = Boolean(options.localSource);
  const getProduct = usingLocalSource
    ? (handle) => readProductLocal(handle, options.localSource)
    : (handle) => fetchProductRemote(handle, options.storeOrigin);

  console.log(
    usingLocalSource
      ? `Reading ${handles.length} product(s) from local source: ${options.localSource}...`
      : `Fetching ${handles.length} product(s) from ${options.storeOrigin}...`
  );

  // append:false (the default) truncates any existing file on the writer's
  // first writeRecords() call; every call after that appends without
  // re-writing the header, so rows are streamed out per-product instead of
  // accumulating the whole result in memory.
  const csvWriter = createArrayCsvWriter({
    header: headers,
    path: options.output,
  });

  const errors = [];
  let totalRows = 0;

  for (const handle of handles) {
    console.log(`Processing handle: ${handle}`);
    const originIndices = originGroups.get(handle) ?? [];
    const originRowsForHandle = originIndices.map((index) => originData[index]);
    let outputRowsForHandle = [];

    try {
      const fetched = await getProduct(handle);
      outputRowsForHandle = buildProductData(fetched, headers, options);
    } catch (error) {
      console.error(`✗ Failed to process ${handle}: ${error.message}`);
      errors.push({ handle, message: error.message });
    }

    const mergedRowsForHandle = mergeHandleRows(originRowsForHandle, outputRowsForHandle, headers, overrideForbiddenHeaders);
    await csvWriter.writeRecords(mergedRowsForHandle);
    totalRows += mergedRowsForHandle.length;

    if (!usingLocalSource) {
      await sleep(SLEEP_MS_DURING_FETCH);
    }
  }

  if (errors.length > 0) {
    console.warn(`\n⚠ ${errors.length} handle(s) failed:`);
    errors.forEach((error) => console.warn(`  - ${error.handle}: ${error.message}`));
  }

  console.log(`\n✓ Wrote ${totalRows} row(s) to ${options.output}`);
}

export function doAction(originCsv, options) {
  const resolvedSource = path.resolve(originCsv);
  if (!existsSync(resolvedSource)) {
    console.error(`✗ Origin CSV file does not exist: ${resolvedSource}`);
    process.exit(1);
  }

  if (!options.localSource && !options.storeOrigin) {
    console.error("✗ Either --local-source or --store-origin is required.");
    process.exit(1);
  }

  const resolvedOptions = {
    output: path.resolve(options.output),
    only: options.only
      ? String(options.only).split(",").map((name) => name.trim()).filter(Boolean)
      : null,
  };

  if (options.localSource) {
    if (options.storeOrigin) {
      console.log("Both --local-source and --store-origin were provided; --local-source takes priority.");
    }

    resolvedOptions.localSource = path.resolve(options.localSource);
    if (!existsSync(resolvedOptions.localSource)) {
      console.error(`✗ Local source folder does not exist: ${resolvedOptions.localSource}`);
      process.exit(1);
    }
  } else {
    try {
      resolvedOptions.storeOrigin = new URL(options.storeOrigin).origin;
    } catch (error) {
      console.error(`✗ Invalid store origin URL: ${options.storeOrigin}`);
      process.exit(1);
    }
  }

  processFetch(resolvedSource, resolvedOptions).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
