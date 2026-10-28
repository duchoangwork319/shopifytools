// create-pages.mjs
// Library: creates pages against the Admin GraphQL API from an HTML file or
// a directory of HTML files. Each file's basename becomes the page's title
// (title-cased) and handle (slugified). A store.json file next to the
// source (see ignore/storedata/all/all.json for the shape) tracks already
// created pages by handle, so re-runs skip ones that already exist.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFileIfExists, writeJsonFile } from './lib/io.mjs';

const CREATE_PAGE_MUTATION = `
  mutation CreatePage($page: PageCreateInput!) {
    pageCreate(page: $page) {
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

// Slugifies a filename (without extension) into a Shopify page handle.
export function slugify(name) {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Title-cases a filename (without extension): every special character
// becomes a space, and each word's first letter is uppercased.
export function titleCase(name) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function createPage(client, page) {
  return graphqlRequest(client, CREATE_PAGE_MUTATION, { page });
}

// Resolves `source` (an .html file or a directory) into the list of .html
// files to create pages from.
function resolveHtmlFiles(source, isDirectory) {
  if (isDirectory) {
    return fs
      .readdirSync(source, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
      .map((entry) => path.join(source, entry.name));
  }

  if (!source.toLowerCase().endsWith('.html')) {
    throw new Error(`Source "${source}" is neither a directory nor an .html file.`);
  }

  return [source];
}

function storeFileFor(source, isDirectory) {
  const dir = isDirectory ? source : path.dirname(source);
  return path.resolve(dir, 'store.json');
}

// Creates a page for each .html file found in `source` (a single file or a
// directory), skipping any handle already recorded in store.json. Each
// successfully created page is appended to store.json as
// { handle, title, bodyFilePath } right away, so a re-run only creates the
// remaining ones.
export async function createPages({ client, source, dryRun = false }) {
  const isDirectory = fs.statSync(source).isDirectory();
  const htmlFiles = resolveHtmlFiles(source, isDirectory);
  const storeFile = storeFileFor(source, isDirectory);

  const store = readJsonFileIfExists(storeFile, []);
  const existingHandles = new Set(store.map((entry) => entry.handle));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of htmlFiles) {
    const basename = path.basename(filePath, path.extname(filePath));
    const handle = slugify(basename);
    const title = titleCase(basename);

    /**
     * Cases:
     * 1. The slugified handle already exists in the store.
     * 2. The basename fetched by `page query` already exists in the store.
     */
    if (existingHandles.has(handle) || existingHandles.has(basename)) {
      console.log(`Skipping "${handle}" - already in ${storeFile}.`);
      skipped += 1;
      continue;
    }

    const body = fs.readFileSync(filePath, 'utf8');

    if (dryRun) {
      console.log(`[dry run] Would create page "${title}" (${handle}) from ${filePath}.`);
      created += 1;
      continue;
    }

    console.log(`Creating page "${title}" (${handle}) from ${filePath}...`);

    const result = await createPage(client, { title, handle, body });
    const pageResult = result.data?.pageCreate;

    if (result.errors?.length || pageResult?.userErrors?.length) {
      console.error(`Failed to create page for "${filePath}":`, result.errors ?? pageResult.userErrors);
      failed += 1;
      continue;
    }

    console.log('Created page:', pageResult.page);
    existingHandles.add(handle);
    store.push({ handle, title, bodyFilePath: filePath });
    writeJsonFile(storeFile, store);
    created += 1;
  }

  console.log(`Summary: ${created} created, ${skipped} skipped, ${failed} failed.`);

  return { created, skipped, failed };
}
