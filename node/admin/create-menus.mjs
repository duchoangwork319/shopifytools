// create-menus.mjs
// Reads the access token saved by auth.mjs and the menu(s) to create from a
// JSON file in data/ (defaults to menu-variables.json; pass a different file
// name/path as the first CLI arg, e.g.
// `node create-menus.mjs mens-menu-create-inputs-20260913-1220.json`).
// The file may hold either a single menuCreate input
// ({ title, handle, items }) or a batch of them
// ({ menuCreateInputs: [{ title, handle, items }, ...] }); each menu runs
// through the CreateCollectionMenu mutation against the Admin GraphQL API.
//
// This script runs after create-collections.mjs. Collection-linked items are
// authored with a `url` (e.g. "/collections/womens-featured-shop-all-women",
// same style as menu-variables.json) rather than a hardcoded `resourceId`,
// since the real resourceId only exists once the collection has been
// created. Before sending each menu, `/collections/<handle>` urls are
// resolved to `resourceId` via collection-resource-ids.json (written by
// create-collections.mjs), read from the same directory as the menu file.
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const envPath = path.join(cwd, '.env', '.env.prd');
config({ path: envPath });

const { SHOPIFY_API_VERSION } = process.env;
const apiVersion = SHOPIFY_API_VERSION || '2026-04';

const tokenFile = path.join(__dirname, 'data', 'access-token.json');
const menuInputArg = process.argv[2];

if (!menuInputArg) {
  console.error('Missing menu input file argument.');
  process.exit(1);
}

const menuVariablesFile = path.isAbsolute(menuInputArg)
  ? menuInputArg
  : path.join(__dirname, 'data', menuInputArg);
const resourceIdsFile = path.join(path.dirname(menuVariablesFile), 'collection-resource-ids.json');

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

function readJsonFile(file, label) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label} file: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Resolves a "/collections/<handle>" item url to its real resourceId using
// the { handle: id } map from collection-resource-ids.json. Items that
// aren't collection links, or whose handle isn't in the map yet, are left
// untouched.
function resolveItemResourceId(item, collectionResourceIds) {
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

function resolveMenuResourceIds(variables, collectionResourceIds) {
  return {
    ...variables,
    items: variables.items.map((item) => resolveItemResourceId(item, collectionResourceIds)),
  };
}

async function createCollectionMenu(shop, accessToken, variables) {
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: CREATE_COLLECTION_MENU_MUTATION,
      variables,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GraphQL HTTP error ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  const { shop, access_token: accessToken } = readJsonFile(tokenFile, 'access token');
  const menuInputs = readJsonFile(menuVariablesFile, 'menu variables');
  const collectionResourceIds = fs.existsSync(resourceIdsFile)
    ? readJsonFile(resourceIdsFile, 'collection resource ids')
    : {};

  if (!shop || !accessToken) {
    console.error(`${tokenFile} is missing "shop" or "access_token". Run auth.mjs first.`);
    process.exit(1);
  }

  let hadErrors = false;

  for (const menuInput of menuInputs) {
    const variables = resolveMenuResourceIds(menuInput, collectionResourceIds);
    console.log(`\nCreating menu "${variables.title}" (${variables.handle})...`);
    const result = await createCollectionMenu(shop, accessToken, variables);
    console.log(JSON.stringify(result, null, 2));

    if (result.errors?.length || result.data?.menuCreate?.userErrors?.length) {
      hadErrors = true;
    }
  }

  if (hadErrors) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
