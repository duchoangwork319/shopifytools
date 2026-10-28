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
 * Convert a wildcard pattern (`*` = any run of characters, `?` = any single
 * character) into an anchored, fully-matching RegExp.
 * @param {string} pattern - Wildcard pattern, e.g. "*-preorder"
 * @returns {RegExp}
 */
function wildcardToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

/**
 * Build a single predicate that decides whether a handle should be kept,
 * combining `--handle`, `--pattern`, and `--regex` with OR semantics — a
 * handle is kept if it matches ANY of the criteria that were provided.
 * @param {object} options - Commander options
 * @returns {(handle: string) => boolean}
 */
function buildHandleMatcher(options) {
  const explicitHandles = new Set(
    String(options.handle || "")
      .split(",")
      .map((handle) => handle.trim())
      .filter(Boolean)
  );

  const patternRegex = options.pattern ? wildcardToRegExp(options.pattern) : null;
  const regex = options.regex ? new RegExp(options.regex) : null;
  const notMatch = Boolean(options.notMatch);

  return (handle) => {
    if (explicitHandles.has(handle)) return true;
    if (patternRegex && patternRegex.test(handle)) return true;
    if (regex) {
      const matches = regex.test(handle);
      if (notMatch ? !matches : matches) return true;
    }
    return false;
  };
}

/**
 * Filter a Shopify CSV file by handle/pattern/regex and write matching rows to a new CSV.
 * @param {string} source - Source CSV file path
 * @param {object} options - Commander options
 * @returns {Promise<void>}
 */
export async function doAction(source, options) {
  const resolvedSource = path.resolve(source);
  const resolvedOutput = options.output ? path.resolve(options.output) : mkDefaultOutput(resolvedSource);

  if (!existsSync(resolvedSource)) {
    console.error(`Source file does not exist: ${resolvedSource}`);
    process.exit(1);
  }

  if (!options.handle && !options.pattern && !options.regex) {
    console.error("At least one of --handle, --pattern, or --regex is required.");
    process.exit(1);
  }

  if (options.notMatch && !options.regex) {
    console.warn("Warning: --not-match has no effect without --regex.");
  }

  const isMatch = buildHandleMatcher(options);
  // Tracks the set of distinct product handles actually kept, so the final
  // count reported to the user reflects unique products rather than rows
  // (a single product can have multiple rows for its variants/media).
  const matchedHandles = new Set();
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
        if (isMatch(row.Handle)) {
          matchedHandles.add(row.Handle);
          rows.push(row);
        }
      })
      .on("end", () => {
        const csvStream = format({ headers });
        const outputStream = createWriteStream(resolvedOutput);

        outputStream.on("error", reject);
        outputStream.on("finish", () => {
          console.log(`Wrote ${rows.length} row(s) for ${matchedHandles.size} product(s) to ${resolvedOutput}`);
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
