// create-menus.mjs
// Library: creates menu(s) against the Admin GraphQL API from the
// per-handle JSON input files in a source directory - <sourceDir>/
// <handle>.json ({ title, handle, items }), the same per-menu file shape
// query-menus.mjs writes. Each menu runs through the CreateCollectionMenu
// mutation against the Admin GraphQL API.
//
// This runs after create-collections.mjs. Collection-linked items are
// authored with a `url` (e.g. "/collections/womens-featured-shop-all-women")
// rather than a hardcoded `resourceId`, since the real resourceId only
// exists once the collection has been created. Before sending each menu,
// `/collections/<handle>` urls are resolved to `resourceId` via
// <collectionSourceDir>/collection-resource-ids.json (written by
// create-collections.mjs / query-collections.mjs), if it exists.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFile, readJsonFileIfExists } from './lib/io.mjs';

// Files in a menu source directory that are never themselves a menu input.
const RESERVED_FILES = new Set(['store.json', 'menu-resource-ids.json']);

const CREATE_COLLECTION_MENU_MUTATION = `
  mutation CreateCollectionMenu(
    $title: String!
    $handle: String!
    $items: [MenuItemCreateInput!]!
  ) {
    menuCreate(title: $title, handle: $handle, items: $items) {
      menu {
        id
        handle
        items {
          id
          title
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Resolves a "/collections/<handle>" item url to its real resourceId using
// the { handle: id } map from resourceIdsFile. Items that aren't collection
// links, or whose handle isn't in the map yet, are left untouched.
export function resolveItemResourceId(item, collectionResourceIds) {
  if (item.resourceId || !item.url) return item;

  const match = item.url.match(/^\/collections\/([^/?#]+)/);
  if (!match) return item;

  const handle = match[1];
  const resourceId = collectionResourceIds[handle];
  if (!resourceId) {
    console.warn(`No collection resource ID found for handle "${handle}" (menu item "${item.title}")`);
    return item;
  }

  const { url, ...rest } = item;
  return { ...rest, resourceId };
}

export function resolveMenuResourceIds(variables, collectionResourceIds) {
  return {
    ...variables,
    items: variables.items.map((item) => resolveItemResourceId(item, collectionResourceIds)),
  };
}

export async function createCollectionMenu(client, variables) {
  return graphqlRequest(client, CREATE_COLLECTION_MENU_MUTATION, variables);
}

// Lists the menu handles to create: `handles` if given, otherwise every
// *.json file in sourceDir that isn't one of the reserved, non-menu files.
function resolveTargetHandles(sourceDir, handles) {
  if (handles?.length) return handles;

  return fs.readdirSync(sourceDir)
    .filter((file) => file.endsWith('.json') && !RESERVED_FILES.has(file))
    .map((file) => path.basename(file, '.json'));
}

// Reads each <sourceDir>/<handle>.json menu input (narrowed to `handles`, or
// every one found in sourceDir if omitted) and creates it, resolving
// collection-linked items via <collectionSourceDir>/collection-resource-ids.json
// if it exists.
export async function createMenus({ client, sourceDir, collectionSourceDir, handles, dryRun = false }) {
  const targetHandles = resolveTargetHandles(sourceDir, handles);
  const resourceIdsFile = path.resolve(collectionSourceDir, 'collection-resource-ids.json');
  const collectionResourceIds = readJsonFileIfExists(resourceIdsFile, {});

  let hadErrors = false;

  for (const handle of targetHandles) {
    const menuInputFile = path.resolve(sourceDir, `${handle}.json`);
    if (!fs.existsSync(menuInputFile)) {
      console.warn(`No menu input JSON file found for handle "${handle}" - skipping.`);
      continue;
    }

    const menuInput = readJsonFile(menuInputFile, `menu "${handle}"`);
    const variables = resolveMenuResourceIds(menuInput, collectionResourceIds);

    if (dryRun) {
      console.log(`[dry run] Would create menu "${variables.title}" (${variables.handle}) with:`, JSON.stringify(variables, null, 2));
      continue;
    }

    console.log(`\nCreating menu "${variables.title}" (${variables.handle})...`);
    const result = await createCollectionMenu(client, variables);
    console.log(JSON.stringify(result, null, 2));

    if (result.errors?.length || result.data?.menuCreate?.userErrors?.length) {
      hadErrors = true;
    }
  }

  return { hadErrors };
}
