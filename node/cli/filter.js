"use strict";

import { createReadStream, createWriteStream, existsSync } from "fs";
import path from "path";
import { parse, format } from "fast-csv";

/**
 * Generate a default output file path based on the source file path.
 * @param {string} source - Source CSV file path
 * @returns {string} - Default output file path
 */
function mkDefaultOutput(source) {
  const dirname = path.dirname(source);
  const basename = path.basename(source, ".csv");
  return path.join(dirname, `${basename}_filtered.csv`);
}

/**
 * Filter a Shopify CSV file by one or more handles and write matching rows to a new CSV.
 * @param {string} source - Source CSV file path
 * @param {object} options - Commander options
 * @returns {Promise<void>}
 */
export async function doAction(source, options) {
  const resolvedSource = path.resolve(source);
  const resolvedOutput = options.output ? path.resolve(options.output) : mkDefaultOutput(resolvedSource);
  const targetHandles = String(options.handle || "")
    .split(",")
    .map((handle) => handle.trim())
    .filter(Boolean);
  const targetHandleSet = new Set(targetHandles);

  if (!existsSync(resolvedSource)) {
    console.error(`Source file does not exist: ${resolvedSource}`);
    process.exit(1);
  }

  if (targetHandles.length === 0) {
    console.error("At least one handle is required.");
    process.exit(1);
  }

  const rows = [];
  let headers = [];

  return new Promise((resolve, reject) => {
    createReadStream(resolvedSource)
      .pipe(parse({ headers: true }))
      .on("error", reject)
      .on("headers", (parsedHeaders) => {
        headers = parsedHeaders;
      })
      .on("data", (row) => {
        if (targetHandleSet.has(row.Handle)) {
          rows.push(row);
        }
      })
      .on("end", () => {
        const csvStream = format({ headers });
        const outputStream = createWriteStream(resolvedOutput);

        outputStream.on("error", reject);
        outputStream.on("finish", () => {
          console.log(`Wrote ${rows.length} rows to ${resolvedOutput}`);
          resolve();
        });

        csvStream.pipe(outputStream);

        for (const row of rows) {
          csvStream.write(row);
        }

        csvStream.end();
      });
  }).catch((error) => {
    console.error(`Error in filter action: ${error.message}`);
    process.exit(1);
  });
}
