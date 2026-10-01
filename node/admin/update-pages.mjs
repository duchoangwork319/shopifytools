// update-pages.mjs
// Library: updates page(s) against the Admin GraphQL API, sourced from a
// store.json file (the shape written by create-pages.mjs/query-pages.mjs:
// an array of { handle, title, bodyFilePath }) in a given folder. Pages can
// be narrowed down by an exact handle or by a title pattern (exact string,
// glob-style wildcard, or /regex/flags).
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFile } from './lib/io.mjs';
import { fetchPageByHandle } from './query-pages.mjs';

const UPDATE_PAGE_MUTATION = `
  mutation UpdatePageById($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function updatePageById(client, id, { title, body }) {
  return graphqlRequest(client, UPDATE_PAGE_MUTATION, {
    id,
    page: {
      ...(title ? { title } : {}),
      ...(body ? { body } : {}),
    },
  });
}

// Builds a matcher for a title pattern: a /regex/flags literal, a
// glob-style wildcard (using * and ?), or an exact (case-insensitive)
// title match.
export function titleMatcher(pattern) {
  const regexLiteral = pattern.match(/^\/(.*)\/([a-z]*)$/i);
  if (regexLiteral) {
    const [, body, flags] = regexLiteral;
    return new RegExp(body, flags);
  }

  if (pattern.includes('*') || pattern.includes('?')) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
  }

  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

// Narrows store entries down to those matching `handle` (exact, must
// exist) and/or `title` (exact/wildcard/regex, via titleMatcher). With
// neither given, every entry is selected.
export function selectEntries(store, { title, handle } = {}) {
  let entries = store;

  if (handle) {
    entries = entries.filter((entry) => entry.handle === handle);
    if (!entries.length) {
      console.error(`Handle "${handle}" not found in store.json.`);
      process.exit(1);
    }
  }

  if (title) {
    const matcher = titleMatcher(title);
    entries = entries.filter((entry) => matcher.test(entry.title));
  }

  return entries;
}

// Reads `<sourceDir>/store.json` (throws/exits if missing), narrows it down
// via `title`/`handle`, and updates each matched page's title/body. Every
// selected entry's bodyFilePath must exist on disk - if a store.json record
// points to a missing file, this exits before updating anything.
export async function updatePages({ client, sourceDir, title, handle }) {
  const storeFile = path.resolve(sourceDir, 'store.json');
  if (!fs.existsSync(storeFile)) {
    console.error(`Missing store.json in ${sourceDir}. Run "page query" or "page create" first.`);
    process.exit(1);
  }

  const store = readJsonFile(storeFile, 'store');
  const entries = selectEntries(store, { title, handle });

  for (const entry of entries) {
    if (!fs.existsSync(entry.bodyFilePath)) {
      console.error(`store.json record "${entry.handle}" points to a missing file: ${entry.bodyFilePath}`);
      process.exit(1);
    }
  }

  let updated = 0;
  let failed = 0;

  for (const entry of entries) {
    const remotePage = await fetchPageByHandle(client, entry.handle);
    if (!remotePage) {
      console.error(`No page found on Shopify for handle "${entry.handle}" - skipping.`);
      failed += 1;
      continue;
    }

    const body = fs.readFileSync(entry.bodyFilePath, 'utf8');
    console.log(`Updating page "${entry.title}" (${entry.handle})...`);

    const result = await updatePageById(client, remotePage.id, { title: entry.title, body });
    const pageResult = result.data?.pageUpdate;

    if (result.errors?.length || pageResult?.userErrors?.length) {
      console.error(`Failed to update page "${entry.handle}":`, result.errors ?? pageResult.userErrors);
      failed += 1;
      continue;
    }

    console.log('Updated page:', pageResult.page);
    updated += 1;
  }

  console.log(`Update complete. ${updated} succeeded, ${failed} failed.`);

  return { updated, failed };
}
