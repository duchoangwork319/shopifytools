"use strict";

import { readFileSync, writeFileSync } from "fs";
import { load } from "cheerio";
import { listFiles } from "../lib/filesystem.js";

/**
 * Process Shopify product JSON files and transform them to a structured format.
 * @param {string} sourceDir - Source directory containing JSON files
 * @param {object} options - Options object with output path
 */
export function doAction(sourceDir, options) {
  try {
    const jsonFiles = listFiles(sourceDir, ".json");
    const results = [];

    for (const filePath of jsonFiles) {
      try {
        const fileContent = readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);

        const descriptionText = jsonData.description 
          ? load(jsonData.description).text() 
          : "";

        const processedObject = {
          input: descriptionText,
          output: {
            name: jsonData.title || "",
            price: jsonData.price || "",
            url: jsonData.url || ""
          }
        };

        results.push(processedObject);
      } catch (error) {
        console.error(`Error processing file ${filePath}: ${error.message}`);
      }
    }

    writeFileSync(options.output, JSON.stringify(results, null, 2), "utf-8");
    console.log(`Successfully saved ${results.length} processed items to ${options.output}`);
  } catch (error) {
    console.error(`Error in preprocess action: ${error.message}`);
  }
}
