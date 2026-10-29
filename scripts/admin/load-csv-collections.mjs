// load-csv-collections.mjs
// Library: reads a CSV file (header row incl. "handle") and merges its other
// columns into each matching `<sourceDir>/<handle>.json` collection file
// written by query-collections.mjs. If the CSV includes a `title` column,
// the matching entry's title in `<sourceDir>/store.json` is updated too. A
// `description` column also auto-assigns `descriptionHtml` to the same
// value, since `descriptionHtml` - not `description` - is the field
// update-collections.mjs actually sends to collectionUpdate.
import fs from 'fs';
import path from 'path';
import { parseCsv, readJsonFile, readJsonFileIfExists, writeJsonFile } from './lib/io.mjs';

export function loadCsvCollections({ csvFile, sourceDir }) {
  const rows = parseCsv(fs.readFileSync(csvFile, 'utf8'));
  const columns = rows.length ? Object.keys(rows[0]).filter((key) => key !== 'handle') : [];
  const updatesTitle = columns.includes('title');

  const storeFile = path.resolve(sourceDir, 'store.json');
  const store = readJsonFileIfExists(storeFile, []);

  let updatedCount = 0;
  for (const row of rows) {
    const { handle } = row;
    if (!handle) {
      console.warn('Skipping CSV row with no handle.');
      continue;
    }

    const collectionFile = path.resolve(sourceDir, `${handle}.json`);
    if (!fs.existsSync(collectionFile)) {
      console.warn(`No collection JSON file found for handle "${handle}" - skipping.`);
      continue;
    }

    const entry = readJsonFile(collectionFile, `collection "${handle}"`);
    for (const column of columns) {
      entry[column] = row[column];
      if (column === 'description') {
        entry.descriptionHtml = row[column];
      }
    }
    writeJsonFile(collectionFile, entry);
    updatedCount += 1;
    console.log(`Updated collection "${handle}" from CSV.`);

    if (updatesTitle) {
      const storeEntry = store.find((e) => e.handle === handle);
      if (storeEntry) storeEntry.title = row.title;
    }
  }

  if (updatesTitle) {
    writeJsonFile(storeFile, store);
    console.log(`Updated title(s) in ${storeFile}`);
  }

  return { count: updatedCount };
}
