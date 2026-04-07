"use strict";

import { createArrayCsvWriter } from "csv-writer";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import * as cheerio from "cheerio";
import header from "../../src/shared/json/header.json" with { type: "json" };
import config from "../../src/shared/json/config.json" with { type: "json" };
import { buildMainMap } from "../../src/shared/csv/mapping.js";
import { createProductCsvRowsWithMap } from "../../src/shared/csv/rows.js";
import { sanityHtml } from "../../src/shared/util.js";

/**
 * Lists all files in the client/js folder.
 * @param {string} resolvedPath - resolved path
 * @param {string} ext - file extension matching
 * @returns {Array} 
 */
function listFiles(resolvedPath, ext) {
  try {
    const files = readdirSync(resolvedPath, { withFileTypes: true });
    return files
      .filter(file => file.isFile() && file.name.endsWith(ext))
      .map(file => path.join(resolvedPath, file.name));
  } catch (error) {
    console.error(`Error reading folder: ${error.message}`);
    throw error;
  }
};

/**
 * Read HTML content from a file
 * @param {string} filePath - The path to the JSON file
 * @returns {string} - HTML content or empty string
 */
function readHtml(filePath) {
  try {
    const htmlPath = filePath.replace(/\.json$/i, ".html");
    if (!existsSync(htmlPath)) return "";
    const html = readFileSync(htmlPath, "utf8");
    return sanityHtml(html) || "";
  } catch (err) {
    return "";
  }
}

/**
 * Safely import JSON data from a file, with error handling.
 * @param {string} jsonPath - The path to the JSON file
 * @returns {Object} - The parsed JSON data or an empty object
 */
function safeImportJson(jsonPath) {
  const rawData = readFileSync(jsonPath, "utf8");
  const product = JSON.parse(rawData);
  return product;
}

/**
 * Exclude specific headers from the list of headers.
 * @param {string[]} headers - The original list of headers
 * @returns {string[]} - The filtered list of headers with specific ones excluded
 */
function excludeHeaders(headers) {
  return headers.filter(header => ![
    "Variant Inventory Qty",
    "Variant Price",
    "Size Chart (product.metafields.bwp_fields.size_chart)",
  ].includes(header));
}

function processProducts(options) {
  const productFiles = listFiles(options.sourceDir, ".json");//.slice(0, 1);
  const counters = { products: 0, variants: 0 };
  const headers = excludeHeaders(header.headers);
  const mainMap = buildMainMap(headers);
  const csvWriter = createArrayCsvWriter({
    header: mainMap.map(entry => entry.header),
    path: options.output
  });

  const processProductFiles = async () => {
    for (let i = 0; i < productFiles.length; i++) {
      const filePath = productFiles[i];
      const product = safeImportJson(filePath);
      const html = cheerio.load(readHtml(filePath));
      const finalOptions = {
        product,
        html,
        mainMap,
        csvConfig: config.csv || {},
        valuesOnly: true,
        transformOption: {}
      };

      const { rows } = createProductCsvRowsWithMap(finalOptions);

      await csvWriter.writeRecords(rows);

      console.log(`[${i + 1}]\tDone...${product.title}`);
    }
  };

  processProductFiles()
    .then(() => console.log(`\nWrote ${counters.products} products and ${counters.variants} variants to ${options.output}`))
    .catch(error => console.error(error));
}

export function doAction(sourceDir, options) {
  const resolvedOptions = {
    sourceDir: path.resolve(sourceDir),
    output: path.resolve(options.output),
  };

  if (!existsSync(resolvedOptions.sourceDir)) {
    console.error(`✗ Source directory does not exist: ${resolvedOptions.sourceDir}`);
    process.exit(1);
  }

  processProducts(resolvedOptions);
}
