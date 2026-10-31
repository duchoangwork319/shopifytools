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
import { readJsonFile, readJsonFileIfExists, saveResourceIds, writeJsonFile } from './lib/io.mjs';

// Files in a menu source directory that are never themselves a menu input.
const RESERVED_FILES = new Set(['store.json', 'menu-resource-ids.json']);

// Same shape as query-menus.mjs's MENU_ITEM_FIELDS, so the menu this mutation
// returns can be written back to <sourceDir>/<handle>.json exactly like a
// freshly-queried one.
const MENU_ITEM_FIELDS = `
  id
  title
  type
  url
  resourceId
`;

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
        title
        isDefault
        items {
          ${MENU_ITEM_FIELDS}
          items {
            ${MENU_ITEM_FIELDS}
          }
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
  return { ...rest, type: 'COLLECTION', resourceId };
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
// if it exists. On success, the created menu is written back to
// <sourceDir>/<handle>.json (now with real item ids/resourceIds), and added
// to <sourceDir>/menu-resource-ids.json and <sourceDir>/store.json - the
// same three files query-menus.mjs maintains.
export async function createMenus({ client, sourceDir, collectionSourceDir, handles, dryRun = false }) {
  const targetHandles = resolveTargetHandles(sourceDir, handles);
  const collectionResourceIdsFile = path.resolve(collectionSourceDir, 'collection-resource-ids.json');
  const collectionResourceIds = readJsonFileIfExists(collectionResourceIdsFile, {});

  const menuResourceIdsFile = path.resolve(sourceDir, 'menu-resource-ids.json');
  const menuResourceIds = readJsonFileIfExists(menuResourceIdsFile, {});
  const storeFile = path.resolve(sourceDir, 'store.json');
  const store = readJsonFileIfExists(storeFile, []);
  const storeHandles = new Set(store.map((entry) => entry.handle));

  let hadErrors = false;
  const counts = { skipped: 0, created: 0, errors: 0 };

  for (const handle of targetHandles) {
    const menuInputFile = path.resolve(sourceDir, `${handle}.json`);
    if (!fs.existsSync(menuInputFile)) {
      console.warn(`No menu input JSON file found for handle "${handle}" - skipping.`);
      counts.skipped += 1;
      continue;
    }

    const menuInput = readJsonFile(menuInputFile, `menu "${handle}"`);

    if (menuResourceIds[menuInput.handle]) {
      console.log(`Menu "${menuInput.handle}" already exists (${menuResourceIds[menuInput.handle]}) - skipping.`);
      counts.skipped += 1;
      continue;
    }

    const variables = resolveMenuResourceIds(menuInput, collectionResourceIds);

    if (dryRun) {
      console.log(`[dry run] Would create menu "${variables.title}" (${variables.handle}) with:`, JSON.stringify(variables, null, 2));
      counts.created += 1;
      continue;
    }

    console.log(`\nCreating menu "${variables.title}" (${variables.handle})...`);
    const result = await createCollectionMenu(client, variables);
    console.log(JSON.stringify(result, null, 2));

    if (result.errors?.length || result.data?.menuCreate?.userErrors?.length) {
      hadErrors = true;
      counts.errors += 1;
      continue;
    }

    const menu = result.data.menuCreate.menu;
    writeJsonFile(menuInputFile, {
      handle: menu.handle,
      title: menu.title,
      isDefault: menu.isDefault,
      items: menu.items,
    });

    saveResourceIds(menuResourceIdsFile, { [menu.handle]: menu.id });
    menuResourceIds[menu.handle] = menu.id;

    if (!storeHandles.has(menu.handle)) {
      store.push({ handle: menu.handle, title: menu.title, filePath: menuInputFile });
      storeHandles.add(menu.handle);
      writeJsonFile(storeFile, store);
    }

    counts.created += 1;
  }

  console.log(
    `\nSkipped: ${counts.skipped}, Created: ${counts.created}, Errors: ${counts.errors}`,
  );

  return { hadErrors };
}
