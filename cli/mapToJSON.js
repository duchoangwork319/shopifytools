"use strict";

const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const outputFile = path.join(cwd, "ignore/shopify/products.json");
/**
 * Lists all .js files in the client/js folder.
 * @param {string} rPath - relative path
 * @param {string} ext - file extension matching
 * @returns {Array} 
 */
function listFiles(rPath, ext) {
  const folderPath = path.join(cwd, rPath);
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    return files
      .filter(file => file.isFile() && file.name.endsWith(ext))
      .map(file => path.join(folderPath, file.name));
  } catch (error) {
    console.error(`Error reading folder: ${error.message}`);
    throw error;
  }
};

function processProducts() {
  const productFiles = listFiles("ignore/shopify/master", ".json");//.slice(0, 1);
  const products = [];

  for (let i = 0; i < productFiles.length; i++) {
    const file = productFiles[i];
    const product = require(file);
    products.push(product);
  }

  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2), "utf-8");
  console.log(`Saved ${products.length} products to ${outputFile}`);
}

if (require.main === module) {
  processProducts();
}