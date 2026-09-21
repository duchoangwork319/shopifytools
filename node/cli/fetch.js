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
 * Fetch a product's JSON and HTML from the storefront. Pure I/O.
 * @param {string} handle - Product handle
 * @param {string} storeOrigin - Store origin URL
 * @returns {Promise<{ handle: string, product: Object, htmlDocument: string }>}
 */
async function fetchProduct(handle, storeOrigin) {
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
 * Build CSV rows (as header-keyed objects) from an already-fetched product.
 * Pure data transform — no network I/O.
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
 * Fetch every handle, continuing past individual failures instead of
 * aborting the whole batch. Failed handles are collected (not silently
 * dropped); successfully fetched rows are kept.
 */
async function fetchAllProducts(handles, storeOrigin, headers, options) {
  const outputData = [];
  const errors = [];

  for (const handle of handles) {
    console.log(`Fetching handle: ${handle}`);
    try {
      const fetched = await fetchProduct(handle, storeOrigin);
      const rows = buildProductData(fetched, headers, options);
      outputData.push(...rows);
    } catch (error) {
      console.error(`✗ Failed to fetch ${handle}: ${error.message}`);
      errors.push({ handle, message: error.message });
    }
    await sleep(SLEEP_MS_DURING_FETCH);
  }

  return { data: outputData, errors };
}

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
 * Merge the origin CSV rows with freshly fetched rows, mirroring the web
 * app's `mergeOriginWithOutput`: every included column always takes the
 * fetched value (even if empty), except `overrideForbidden` columns, which
 * always keep the origin value.
 */
function mergeOriginWithOutput(originRows, outputRows, headers, overrideForbiddenHeaders) {
  const originGroups = groupByHandle(originRows);
  const outputGroups = groupByHandle(outputRows);
  const merged = [];

  for (const [handle, originIndices] of originGroups) {
    const outputIndices = outputGroups.get(handle) ?? [];

    originIndices.forEach((originRowIndex, position) => {
      const originRow = originRows[originRowIndex];
      const outputRowIndex = outputIndices[position];

      if (outputRowIndex === undefined) {
        merged.push(headers.map((header) => originRow[header] ?? ""));
        return;
      }

      const outputRow = outputRows[outputRowIndex];
      merged.push(headers.map((header) =>
        overrideForbiddenHeaders.has(header) ? (originRow[header] ?? "") : (outputRow[header] ?? "")
      ));
    });

    if (outputIndices.length > originIndices.length) {
      for (let i = originIndices.length; i < outputIndices.length; i++) {
        const outputRow = outputRows[outputIndices[i]];
        merged.push(headers.map((header) => outputRow[header] ?? ""));
      }
    }
  }

  return merged;
}

async function processFetch(originCsvPath, options) {
  const { data: originData, handles } = readOriginCsv(originCsvPath);
  const headers = options.only ? getOnlyHeaders(options.only) : getIncludedHeaders();
  const overrideForbiddenHeaders = getOverrideForbiddenHeaders();

  let targetHandles = handles;
  if (options.handleSuffix) {
    const re = new RegExp(`${options.handleSuffix}$`, "g");
    targetHandles = targetHandles.map((handle) => (re.test(handle) ? handle.replace(re, "") : handle));
  }

  console.log(`Fetching ${targetHandles.length} product(s) from ${options.storeOrigin}...`);

  const { data: outputData, errors } = await fetchAllProducts(targetHandles, options.storeOrigin, headers, options);

  if (errors.length > 0) {
    console.warn(`\n⚠ ${errors.length} handle(s) failed to fetch:`);
    errors.forEach((error) => console.warn(`  - ${error.handle}: ${error.message}`));
  }

  const mergedRows = mergeOriginWithOutput(originData, outputData, headers, overrideForbiddenHeaders);

  const csvWriter = createArrayCsvWriter({
    header: headers,
    path: options.output,
  });
  await csvWriter.writeRecords(mergedRows);

  console.log(`\n✓ Wrote ${mergedRows.length} row(s) to ${options.output}`);
}

export function doAction(originCsv, options) {
  const resolvedSource = path.resolve(originCsv);
  if (!existsSync(resolvedSource)) {
    console.error(`✗ Origin CSV file does not exist: ${resolvedSource}`);
    process.exit(1);
  }

  let storeOrigin;
  try {
    storeOrigin = new URL(options.storeOrigin).origin;
  } catch (error) {
    console.error(`✗ Invalid store origin URL: ${options.storeOrigin}`);
    process.exit(1);
  }

  const only = options.only
    ? String(options.only).split(",").map((name) => name.trim()).filter(Boolean)
    : null;

  const resolvedOptions = {
    output: path.resolve(options.output),
    storeOrigin,
    publishProducts: Boolean(options.publishProducts),
    inventoryPolicyContinue: Boolean(options.inventoryPolicyContinue),
    handleSuffix: options.handleSuffix || "",
    appendTags: options.appendTags || "",
    only,
  };

  processFetch(resolvedSource, resolvedOptions).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
