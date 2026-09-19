"use strict";

import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

/**
 * Lists all files in a folder matching an extension.
 * @param {string} resolvedPath - resolved path
 * @param {string} ext - file extension matching
 * @returns {Array}
 */
function listFiles(resolvedPath, ext) {
  try {
    const files = readdirSync(resolvedPath, { withFileTypes: true });
    return files
      .filter((file) => file.isFile() && file.name.endsWith(ext))
      .map((file) => path.join(resolvedPath, file.name));
  } catch (error) {
    console.error(`Error reading folder: ${error.message}`);
    throw error;
  }
}

/**
 * Group all JSON files in a folder into a single JSON array file.
 * @param {string} sourceDir - Source directory containing JSON files
 * @param {object} options - Options object with output path
 */
function processProducts(sourceDir, options) {
  const productFiles = listFiles(sourceDir, ".json");
  const products = [];

  for (const filePath of productFiles) {
    const fileContent = readFileSync(filePath, "utf-8");
    products.push(JSON.parse(fileContent));
  }

  writeFileSync(options.output, JSON.stringify(products, null, 2), "utf-8");
  console.log(`Saved ${products.length} products to ${options.output}`);
}

export function doAction(sourceDir, options) {
  const resolvedSourceDir = path.resolve(sourceDir);
  const resolvedOutput = path.resolve(options.output);

  try {
    processProducts(resolvedSourceDir, { output: resolvedOutput });
  } catch (error) {
    console.error(`Error in group-to-one-json action: ${error.message}`);
    process.exit(1);
  }
}
