// to-csv-collections.mjs
// Library: converts `<sourceDir>/collections.json` (the shape written by
// query-collections.mjs: an array of { title, handle, ruleSet }) into
// `<sourceDir>/collections.csv`, with one column per requested prop.
import path from 'path';
import fs from 'fs';
import { readJsonFile, toCsv } from './lib/io.mjs';

// Reads collections.json from sourceDir and writes a CSV - `output` if
// given, otherwise collections.csv next to it - with columns from `props`
// (or every key on the first collection, if `props` is empty).
export function collectionsToCsv({ sourceDir, props, output }) {
  const collectionsFile = path.resolve(sourceDir, 'collections.json');
  const collections = readJsonFile(collectionsFile, 'collections');

  const fields = props?.length ? props : Object.keys(collections[0] ?? {});

  const csv = toCsv(collections, fields);
  const csvFile = output ? path.resolve(output) : path.resolve(sourceDir, 'collections.csv');
  fs.mkdirSync(path.dirname(csvFile), { recursive: true });
  fs.writeFileSync(csvFile, csv, 'utf8');
  console.log(`Saved ${collections.length} row(s) to ${csvFile}`);

  return { count: collections.length, csvFile };
}
