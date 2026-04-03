#!node
"use strict";

import { Command } from "commander";
import * as sitemap from "./sitemap.js";
// import * as toCsv from "./toCsv.js";
import * as toCsv from "./newToCsv.js";
import * as preprocess from "./preprocess.js";
import * as filter from "./filter.js";

const program = new Command();

program
  .name("cli")
  .description("Shopify product data management tools - fetch products from sitemap and convert to CSV")
  .version("1.0.0");

program
  .command("sitemap <sitemapUrl>")
  .description("Fetch and save products from a Shopify sitemap (JSON or HTML format)")
  .requiredOption("-o, --output <path>", "Output directory for saved products")
  .option("-m, --mode <mode>", "Output format: json or html", "json")
  .option("-b, --batch-limit <number>", "Number of concurrent requests", "5")
  .action((sitemapUrl, options) => {
    sitemap.doAction(sitemapUrl, options);
  });

program
  .command("tocsv <sourceDir>")
  .description("Convert Shopify product JSON files to a CSV file for bulk import")
  .requiredOption("-o, --output <path>", "Output path for the CSV file")
  .action((sourceDir, options) => {
    toCsv.doAction(sourceDir, options);
  });

program
  .command("preprocess <sourceDir>")
  .description("Process Shopify product JSON files and transform them to a structured format")
  .requiredOption("-o, --output <path>", "Output path for the processed JSON file")
  .action((sourceDir, options) => {
    preprocess.doAction(sourceDir, options);
  });

program
  .command("filter <source>")
  .description("Filter a Shopify CSV file by one or more handles")
  .option("-o, --output <path>", "Output path for the filtered CSV file", false)
  .requiredOption("-d, --handle <handles>", "Comma-separated Shopify handles to keep")
  .action((source, options) => {
    filter.doAction(source, options);
  });

program.parse();
