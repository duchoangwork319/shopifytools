#!node
"use strict";

import { Command } from "commander";
import * as sitemap from "./sitemap.js";
import * as toCsv from "./toCsv.js";
import * as filter from "./filter.js";
import * as mapToJSON from "./mapToJSON.js";
import * as fetchCmd from "./fetch.js";

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
  .requiredOption("-r, --rate-limit <number>", "Number of concurrent requests", "5")
  .requiredOption("-b, --rate-breaker <number>", "Number of concurrent requests", "500")
  .action((sitemapUrl, options) => {
    sitemap.doAction(sitemapUrl, options);
  });

program
  .command("tocsv <sourceDir>")
  .description("Convert Shopify product JSON files to a CSV file for bulk import")
  .requiredOption("-o, --output <path>", "Output path for the CSV file, for example: ./output/products.csv")
  .action((sourceDir, options) => {
    toCsv.doAction(sourceDir, options);
  });

program
  .command("group-to-one-json <sourceDir>")
  .description("Group all Shopify product JSON files in a folder into a single JSON array file")
  .requiredOption("-o, --output <path>", "Output path for the grouped JSON file, for example: ./output/grouped.json")
  .action((sourceDir, options) => {
    mapToJSON.doAction(sourceDir, options);
  });

program
  .command("fetch <originCsv>")
  .description("Fetch the latest product data from a Shopify store for handles in a CSV file, merging into a new CSV (same behavior as the web app's Fetch)")
  .requiredOption("-o, --output <path>", "Output path for the merged CSV file, for example: ./output/merged.csv")
  .requiredOption("-s, --store-origin <url>", "Shopify store origin URL, e.g. https://examplestore.com")
  .option("--publish-products", "Mark products as published and active after fetching", false)
  .option("--inventory-policy-continue", "Allow continued selling when out of stock", false)
  .option("--handle-suffix <suffix>", "Suffix to append to product handles after fetching", "")
  .option("--append-tags <tags>", "Comma-separated tags to append to every product", "")
  .option("--only <columns>", "Comma-separated column names to output, in addition to overrideForbidden/required columns which are always included, for example: \"Tags, Image Src\"")
  .action((originCsv, options) => {
    fetchCmd.doAction(originCsv, options);
  });

program
  .command("filter <source>")
  .description("Filter a Shopify CSV file by handle, wildcard pattern, and/or regular expression")
  .option("-o, --output <path>", "Output path for the filtered CSV file, for example: ./output/filtered.csv", false)
  .option("-d, --handle <handles>", "Comma-separated Shopify handles to keep")
  .option("-p, --pattern <pattern>", "Wildcard pattern to match handles, for example: *-preorder")
  .option("-r, --regex <pattern>", "Regular expression to match handles")
  .option("--not-match", "Keep handles that do NOT match --regex, instead of ones that do", false)
  .action((source, options) => {
    filter.doAction(source, options);
  });

program.parse();
