// lib/io.mjs
// Small shared filesystem helpers used by the admin library scripts.
import fs from 'fs';
import path from 'path';

export function readJsonFile(file, label) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label} file: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function readJsonFileIfExists(file, fallback = {}) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

export function writeJsonFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Merges newResourceIds into the existing { handle: id } map stored at file.
export function saveResourceIds(file, newResourceIds) {
  const existing = readJsonFileIfExists(file, {});
  const merged = { ...existing, ...newResourceIds };
  writeJsonFile(file, merged);
  return merged;
}

// Resolves the collection-resource-ids.json path that sits next to a given
// collections/menu input file.
export function resourceIdsFileFor(inputFile) {
  return path.resolve(path.dirname(inputFile), 'collection-resource-ids.json');
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
