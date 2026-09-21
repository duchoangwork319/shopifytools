"use strict";

import { existsSync, readFileSync } from "fs";
import path from "path";
import Papa from "papaparse";
import { createArrayCsvWriter } from "csv-writer";
import columnsConfig from "../../src/shared/json/columns.json" with { type: "json" };
import csvConfig from "../../src/shared/json/config.json" with { type: "json" };
import { buildMainMap, mapRow } from "../../src/shared/csv/mapping.js";
import { collectTags } from "../../src/shared/csv/product.js";

const TAG_HEADER = "Tags";
const GENDER_HEADERS = [
  "Google Shopping / Gender",
  "Target gender (product.metafields.shopify.target-gender)",
];
const REGENERATED_HEADERS = new Set([TAG_HEADER, ...GENDER_HEADERS]);

/**
 * Output header list: overrideForbidden and required columns (passed through
 * unchanged from the origin CSV), plus Tags and the gender columns
 * (regenerated). Order follows columns.json's ordinal order.
 */
function getOutputHeaders() {
  return columnsConfig
    .filter((field) => field.overrideForbidden || field.required || REGENERATED_HEADERS.has(field.name))
    .map((field) => field.name);
}

function readOriginCsv(csvPath) {
  const content = readFileSync(csvPath, "utf8");
  const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });
  return data;
}

/**
 * Build a minimal product-like object from a CSV row for `collectTags` (and,
 * via mapping.js's public API, the Tags/gender mappers) to run against —
 * there's no raw Shopify product JSON here, just the flattened CSV row.
 * "Body (HTML)" is used as a stand-in for the raw product description, since
 * that's the closest available field in an exported CSV.
 */
function toPseudoProduct(row) {
  const tags = String(row[TAG_HEADER] || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const product = {
    handle: row.Handle || "",
    title: row.Title || "",
    description: row["Body (HTML)"] || "",
    tags,
  };

  return { ...product, _tags: collectTags(product, csvConfig.csv || {}) };
}

export function doAction(originCsv, options) {
  const resolvedSource = path.resolve(originCsv);
  if (!existsSync(resolvedSource)) {
    console.error(`✗ Origin CSV file does not exist: ${resolvedSource}`);
    process.exit(1);
  }

  const resolvedOutput = path.resolve(options.output);
  const rows = readOriginCsv(resolvedSource);
  const headers = getOutputHeaders();
  // Only exported from mapping.js so we generate Tags/gender through the
  // same mappers used everywhere else (mapTags, mapGoogleShoppingGender,
  // mapTargetGender) instead of duplicating their logic here.
  const mainMap = buildMainMap([TAG_HEADER, ...GENDER_HEADERS]);

  // Tags/gender only exist on the first row of each product (the master
  // row) — every other row (variants, media-only) leaves them blank.
  const seenHandles = new Set();

  const outputRows = rows.map((row) => {
    const handle = row.Handle || "";
    const isFirstForHandle = !seenHandles.has(handle);
    seenHandles.add(handle);

    const computed = isFirstForHandle
      ? mapRow(mainMap, toPseudoProduct(row), { isMaster: true, isMediaOnly: false, valuesOnly: false }, {})
      : {};

    return headers.map((header) => (
      REGENERATED_HEADERS.has(header) ? (computed[header] ?? "") : (row[header] ?? "")
    ));
  });

  const csvWriter = createArrayCsvWriter({
    header: headers,
    path: resolvedOutput,
  });

  csvWriter.writeRecords(outputRows)
    .then(() => console.log(`✓ Wrote ${outputRows.length} row(s) to ${resolvedOutput}`))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
