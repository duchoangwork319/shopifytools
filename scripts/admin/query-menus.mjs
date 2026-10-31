// query-menus.mjs
// Library: queries menus from the Admin GraphQL API (all of them, paged;
// the `menus` connection has no server-side handle/title filter) and writes
// one JSON file per menu - `<sourceDir>/<handle>.json` - plus
// `<sourceDir>/store.json` ({ handle, title, filePath }[], appended to) and
// `<sourceDir>/menu-resource-ids.json` ({ handle: id }), mirroring
// query-collections.mjs.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFileIfExists, writeJsonFile } from './lib/io.mjs';

const MENU_ITEM_FIELDS = `
  id
  title
  type
  url
  resourceId
`;

const GET_ALL_MENUS_QUERY = `
  query GetAllMenus($cursor: String) {
    menus(first: 100, after: $cursor) {
      edges {
        cursor
        node {
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
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

// Pages through every menu.
export async function fetchAllMenus(client) {
  let cursor = null;
  let hasNextPage = true;
  const allMenus = [];

  while (hasNextPage) {
    const json = await graphqlRequest(client, GET_ALL_MENUS_QUERY, { cursor });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    const connection = json.data.menus;
    for (const edge of connection.edges) {
      allMenus.push(edge.node);
      cursor = edge.cursor;
    }

    hasNextPage = connection.pageInfo.hasNextPage;
  }

  return allMenus;
}

// Picks the fields written to each menu's JSON file.
function toEntry({ handle, title, isDefault, items }) {
  return { handle, title, isDefault, items };
}

// Fetches menus (by `handles`, or all of them if omitted/empty) and writes
// one JSON file per menu - `<sourceDir>/<handle>.json` ({ handle, title,
// isDefault, items }) - plus `<sourceDir>/store.json` ({ handle, title,
// filePath }[], appended to, never truncated) and
// `<sourceDir>/menu-resource-ids.json` ({ handle: id }).
export async function queryMenus({ client, sourceDir, handles }) {
  fs.mkdirSync(sourceDir, { recursive: true });

  const allMenus = await fetchAllMenus(client);

  let menus;
  if (handles?.length) {
    const byHandle = new Map(allMenus.map((menu) => [menu.handle, menu]));
    menus = [];
    for (const handle of handles) {
      const menu = byHandle.get(handle);
      if (!menu) {
        console.warn(`No menu found for handle "${handle}" - skipping.`);
        continue;
      }
      menus.push(menu);
    }
  } else {
    menus = allMenus;
  }

  const menuFile = (handle) => path.resolve(sourceDir, `${handle}.json`);

  for (const menu of menus) {
    writeJsonFile(menuFile(menu.handle), toEntry(menu));
  }
  console.log(`Saved ${menus.length} menu JSON file(s) to ${sourceDir}`);

  const storeFile = path.resolve(sourceDir, 'store.json');
  const store = readJsonFileIfExists(storeFile, []);
  const existingHandles = new Set(store.map((entry) => entry.handle));
  for (const menu of menus) {
    if (existingHandles.has(menu.handle)) continue;
    store.push({ handle: menu.handle, title: menu.title, filePath: menuFile(menu.handle) });
    existingHandles.add(menu.handle);
  }
  writeJsonFile(storeFile, store);
  console.log(`Saved ${store.length} menu entrie(s) to ${storeFile}`);

  const resourceIdsFile = path.resolve(sourceDir, 'menu-resource-ids.json');
  const resourceIds = {};
  for (const { handle, id } of menus) {
    resourceIds[handle] = id;
  }
  writeJsonFile(resourceIdsFile, resourceIds);
  console.log(`Saved ${Object.keys(resourceIds).length} menu resource ID(s) to ${resourceIdsFile}`);

  return { count: menus.length };
}
