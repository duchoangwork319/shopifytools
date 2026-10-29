// load-csv-collections.mjs
// Library: reads a CSV file (header row incl. "handle") and merges its other
// columns into each matching `<sourceDir>/<handle>.json` collection file
// written by query-collections.mjs. If the CSV includes a `title` column,
// the matching entry's title in `<sourceDir>/store.json` is updated too. A
// `description` column also auto-assigns `descriptionHtml` to the same
// value, since `descriptionHtml` - not `description` - is the field
// update-collections.mjs actually sends to collectionUpdate. A column named
// `metafields.{namespace}.{key}` (namespace is always `bwp_fields`) is
// merged into the entry's `metafields` array instead - see
// resolveMetafieldColumns / applyMetafieldColumn.
import fs from 'fs';
import path from 'path';
import { parseCsv, readJsonFile, readJsonFileIfExists, writeJsonFile } from './lib/io.mjs';

const METAFIELD_CONFIG_FILE = path.resolve(import.meta.dirname, 'config', 'metafields', 'collection.json');
const METAFIELD_COLUMN_PREFIX = 'metafields.';
const METAFIELD_COLUMN = /^metafields\.([^.]+)\.(.+)$/;

// Resolves each `metafields.{namespace}.{key}` column's `namespace`/`key`/
// `type` (from config/metafields/collection.json), keyed by column name -
// done once per CSV, not once per row. A column whose namespace.key isn't
// in that config is left out (and warned about) rather than silently
// written as a plain field.
function resolveMetafieldColumns(columns) {
  const metafieldConfig = readJsonFile(METAFIELD_CONFIG_FILE, 'metafield config');
  const defsByColumn = new Map();

  for (const column of columns) {
    if (!column.startsWith(METAFIELD_COLUMN_PREFIX)) continue;

    const [, namespace, key] = column.match(METAFIELD_COLUMN) ?? [];
    const definition = namespace && metafieldConfig[`${namespace}.${key}`];
    if (!definition) {
      console.warn(`No metafield config found for column "${column}" - skipping.`);
      continue;
    }

    defsByColumn.set(column, { namespace, key, type: definition.type });
  }

  return defsByColumn;
}

// Merges one metafield column's value into entry.metafields (matching the
// shape written by query-collections.mjs / update-collections.mjs: id?,
// namespace, key, type, value, ownerId). `ownerId` is the collection's id,
// resolved from collection-resource-ids.json by handle - when it's missing,
// the metafield isn't added, and a warning is logged instead.
function applyMetafieldColumn(entry, value, handle, { namespace, key, type }, collectionResourceIds) {
  const ownerId = collectionResourceIds[handle];
  if (!ownerId) {
    console.warn(`No collection resource ID found for handle "${handle}" - skipping metafield "${namespace}.${key}".`);
    return;
  }

  entry.metafields = entry.metafields ?? [];
  const existing = entry.metafields.find((field) => field.namespace === namespace && field.key === key);
  if (existing) {
    existing.type = type;
    existing.value = value;
    existing.ownerId = ownerId;
  } else {
    entry.metafields.push({ namespace, key, type, value, ownerId });
  }
}

export function loadCsvCollections({ csvFile, sourceDir }) {
  const rows = parseCsv(fs.readFileSync(csvFile, 'utf8'));
  const columns = rows.length ? Object.keys(rows[0]).filter((key) => key !== 'handle') : [];
  const metafieldDefsByColumn = resolveMetafieldColumns(columns);
  const updatesTitle = columns.includes('title');

  const storeFile = path.resolve(sourceDir, 'store.json');
  const store = readJsonFileIfExists(storeFile, []);
  const resourceIdsFile = path.resolve(sourceDir, 'collection-resource-ids.json');
  const collectionResourceIds = readJsonFileIfExists(resourceIdsFile, {});

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
      if (column.startsWith(METAFIELD_COLUMN_PREFIX)) {
        const definition = metafieldDefsByColumn.get(column);
        if (definition) {
          applyMetafieldColumn(entry, row[column], handle, definition, collectionResourceIds);
        }
        continue;
      }

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
