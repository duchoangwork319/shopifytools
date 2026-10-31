// update-menus.mjs
// Library: updates menu(s) against the Admin GraphQL API, sourced from the
// per-menu JSON files written by query-menus.mjs: <sourceDir>/store.json
// ({ handle, title, filePath }[], narrowed to `handles` and/or a `title`
// pattern - exact string, glob-style wildcard, or /regex/flags - or every
// entry if neither is given) plus each entry's own <sourceDir>/<handle>.json
// ({ handle, title, isDefault, items }). Each handle's `id` is resolved via
// <sourceDir>/menu-resource-ids.json.
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { readJsonFile } from './lib/io.mjs';

const UPDATE_MENU_MUTATION = `
  mutation UpdateMenu(
    $id: ID!
    $title: String!
    $handle: String!
    $items: [MenuItemUpdateInput!]!
  ) {
    menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
      menu {
        id
        handle
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Map a MenuItem tree (as read from <handle>.json) into MenuItemUpdateInput[].
export function mapItemsToUpdateInput(items) {
  return (items || []).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    url: item.url,
    resourceId: item.resourceId,
    items: mapItemsToUpdateInput(item.items),
  }));
}

export async function updateMenuById(client, id, { title, handle, items }) {
  return graphqlRequest(client, UPDATE_MENU_MUTATION, {
    id,
    title,
    handle,
    items: mapItemsToUpdateInput(items),
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

// Narrows store.json entries down to `handles` (every one must exist)
// and/or `title` (exact/wildcard/regex, via titleMatcher). With neither
// given, every entry is selected.
export function selectMenus(store, { handles, title } = {}) {
  let entries = store;

  if (handles?.length) {
    const byHandle = new Map(store.map((entry) => [entry.handle, entry]));
    entries = [];
    for (const handle of handles) {
      const entry = byHandle.get(handle);
      if (!entry) {
        console.error(`Handle "${handle}" not found in store.json.`);
        process.exit(1);
      }
      entries.push(entry);
    }
  }

  if (title) {
    const matcher = titleMatcher(title);
    entries = entries.filter((entry) => matcher.test(entry.title));
  }

  return entries;
}

// Reads <sourceDir>/store.json (exits if missing), narrows it down via
// `handles`, resolves each handle's id via <sourceDir>/menu-resource-ids.json,
// and pushes each selected menu's title/handle/items - read from its own
// <sourceDir>/<handle>.json - back to Shopify via menuUpdate.
export async function updateMenus({ client, sourceDir, handles, title, dryRun = false }) {
  const storeFile = path.resolve(sourceDir, 'store.json');
  const store = readJsonFile(storeFile, 'menu store');
  const entries = selectMenus(store, { handles, title });

  const resourceIdsFile = path.resolve(sourceDir, 'menu-resource-ids.json');
  const menuResourceIds = readJsonFile(resourceIdsFile, 'menu resource ids');

  let updated = 0;
  let failed = 0;

  for (const storeEntry of entries) {
    const id = menuResourceIds[storeEntry.handle];
    if (!id) {
      console.error(`No menu resource ID found for handle "${storeEntry.handle}".`);
      failed += 1;
      continue;
    }

    const menuFile = path.resolve(storeEntry.filePath);
    const menu = readJsonFile(menuFile, `menu "${storeEntry.handle}"`);

    if (dryRun) {
      console.log(`[dry run] Would update menu "${menu.title}" (${menu.handle}).`);
      updated += 1;
      continue;
    }

    console.log(`Updating menu "${menu.title}" (${menu.handle})...`);
    const result = await updateMenuById(client, id, menu);
    const menuResult = result.data?.menuUpdate;

    if (result.errors?.length || menuResult?.userErrors?.length) {
      console.error(`Failed to update menu "${menu.handle}":`, result.errors ?? menuResult.userErrors);
      failed += 1;
      continue;
    }

    console.log('Updated menu:', menuResult.menu);
    updated += 1;
  }

  console.log(`Update complete. ${updated} succeeded, ${failed} failed.`);

  return { updated, failed };
}
