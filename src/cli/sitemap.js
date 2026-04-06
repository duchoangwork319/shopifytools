"use strict";

import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { fetchProduct, fetchXMLContent } from "../shared/api.js";

// Find product sitemap URL from sitemap index
const findProductSitemapUrl = (sitemapIndex) => {
  const sitemaps = sitemapIndex.sitemapindex.sitemap || [];
  return sitemaps
    .find(sitemap => sitemap.loc[0].includes("sitemap_products_1"))
    ?.loc[0];
};

/**
 * Extract product URLs from sitemap
 * @param {Object} sitemap - XML sitemap object
 * @returns {Array} - array of product URLs
 */
const extractProductUrls = (sitemap) => {
  const urls = sitemap.urlset.url || [];
  return urls.map(url => url.loc[0]);
};

const makeFilePath = (filename, options) => {
  const cleanFilename = filename.replace(/\.[^\/\.]+$/, "");
  const isHtmlMode = options.mode === "html";
  const ext = isHtmlMode ? ".html" : ".json";
  return path.join(options.output, `${cleanFilename}${ext}`);
};

const saveText = (filepath, text) => {
  writeFileSync(filepath, text);
  console.log(`Successfully saved: ${filepath}`);
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution flow
const processSitemap = async (sitemapUrl, options) => {
  try {
    // Ensure output folder exists recursively
    if (!existsSync(options.output)) {
      mkdirSync(options.output, { recursive: true });
    }

    // Fetch and parse main sitemap
    const sitemapIndex = await fetchXMLContent(sitemapUrl);

    // Find product sitemap URL
    const productSitemapUrl = findProductSitemapUrl(sitemapIndex);
    if (!productSitemapUrl) {
      throw new Error("Product sitemap URL not found");
    }

    // Fetch and parse product sitemap
    const productSitemap = await fetchXMLContent(productSitemapUrl);

    // Process each product URL
    const productUrls = extractProductUrls(productSitemap)
      .map(url => ({
        apiUrl: options.mode === "html" ? url : `${url}.js`,
        filename: url.split("/").pop()
      }))
      .filter(obj => obj.filename !== "");

    console.log(`Found ${productUrls.length} product URL(s).`);

    // Process products in parallel with concurrency limit
    for (let i = 0; i < productUrls.length; i += options.rateLimit) {
      const batch = productUrls.slice(i, i + options.rateLimit);
      const fn = async (product) => {
        const text = await fetchProduct(product.apiUrl, options);
        const filePath = makeFilePath(product.filename, options);
        return { text, filePath };
      };
      const records = await Promise.all(batch.map(fn));
      records.forEach(rec => saveText(rec.filePath, rec.text));
      await sleep(options.rateBreaker);
    }

    console.log("All products processed successfully");
  } catch (error) {
    console.error("Error in processSitemap:", error.message);
    throw error;
  }
};

export function doAction(sitemapUrl, options) {
  const resolvedOptions = {
    output: path.resolve(options.output),
    mode: options.mode,
    rateLimit: parseInt(options.rateLimit, 10),
    rateBreaker: parseInt(options.rateBreaker, 10),
  };

  if (!["json", "html"].includes(resolvedOptions.mode)) {
    console.error("✗ Invalid mode. Use 'json' or 'html'.");
    process.exit(1);
  }

  processSitemap(sitemapUrl, resolvedOptions)
    .catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
