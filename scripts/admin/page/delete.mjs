// page/delete.mjs
// Library: deletes page(s) from the Admin GraphQL API, sourced from
// <sourceDir>/_searchable-attrs.json (the shape written by page/create.mjs /
// page/query.mjs: an array of { id, handle, title, bodyFilePath }).
// Narrowed down to specific handles, or every entry if omitted. On success,
// the matched entry is removed from _searchable-attrs.json; with --delete-html, its
// bodyFilePath is deleted too.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from '../lib/api-client.mjs';
import { readJsonFile, writeJsonFile } from '../lib/io.mjs';
import { FILE } from '../lib/constants.mjs';

const DELETE_PAGE_MUTATION = `
  mutation DeletePage($id: ID!) {
    pageDelete(id: $id) {
      deletedPageId
      userErrors {
        field
        message
      }
    }
  }
`;

export async function deletePageById(client, id) {
  return graphqlRequest(client, DELETE_PAGE_MUTATION, { id });
}

// Narrows store entries down to the given handles (every one must exist),
// or every entry if `handles` is empty.
function selectEntries(store, handles) {
  if (!handles.length) return store;

  const entries = handles.map((handle) => {
    const entry = store.find((e) => e.handle === handle);
    if (!entry) {
      console.error(`Handle "${handle}" not found in _searchable-attrs.json.`);
      process.exit(1);
    }
    return entry;
  });

  return entries;
}

// Reads `<sourceDir>/_searchable-attrs.json` (throws/exits if missing), narrows it down
// to `handles` (or every entry if omitted), and deletes each matched page
// from Shopify, removing it from _searchable-attrs.json on success. With
// `deleteHtml`, its bodyFilePath is also deleted from disk.
export async function deletePages({ client, sourceDir, handles = [], deleteHtml = false, dryRun = false }) {
  const storeFile = path.resolve(sourceDir, FILE.SEARCHABLE_ATTRS);
  if (!fs.existsSync(storeFile)) {
    console.error(`Missing ${FILE.SEARCHABLE_ATTRS} in ${sourceDir}. Run "page query" or "page create" first.`);
    process.exit(1);
  }

  const store = readJsonFile(storeFile, 'store');
  const entries = selectEntries(store, handles);

  let deleted = 0;
  let failed = 0;

  for (const entry of entries) {
    if (!entry.id) {
      console.error(`_searchable-attrs.json record "${entry.handle}" has no id - run "page query" to refresh it.`);
      failed += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[dry run] Would delete page "${entry.title}" (${entry.handle}).`);
      deleted += 1;
      continue;
    }

    console.log(`Deleting page "${entry.title}" (${entry.handle})...`);

    const result = await deletePageById(client, entry.id);
    const deleteResult = result.data?.pageDelete;

    if (result.errors?.length || deleteResult?.userErrors?.length) {
      console.error(`Failed to delete page "${entry.handle}":`, result.errors ?? deleteResult.userErrors);
      failed += 1;
      continue;
    }

    console.log('Deleted page:', deleteResult.deletedPageId);

    if (deleteHtml && entry.bodyFilePath && fs.existsSync(entry.bodyFilePath)) {
      fs.rmSync(entry.bodyFilePath);
      console.log(`Deleted HTML file ${entry.bodyFilePath}.`);
    }

    const index = store.findIndex((e) => e.handle === entry.handle);
    if (index !== -1) store.splice(index, 1);
    writeJsonFile(storeFile, store);
    deleted += 1;
  }

  console.log(`Delete complete. ${deleted} succeeded, ${failed} failed.`);

  return { deleted, failed };
}
