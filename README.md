# Shopify Tools

![5DLA logo](public/5DLA_header_logo_white_bg.png)

Shopify Tools is a browser-based product CSV sync utility, plus Node.js command-line tools for collecting, transforming, and managing Shopify product, collection, menu, and page data.

## What it does

### Product CSV sync app

The web app imports a Shopify product CSV, fetches current product data from a storefront, and lets you review and download the merged result.

1. Import a CSV containing a `Handle` column.
2. Open **Configuration** and set the storefront origin (for example, `https://store.example.com`).
3. Choose which output columns to include and configure fetch options.
4. Select **Fetch** to retrieve each distinct product handle. The app requests both the storefront product JSON and HTML pages.
5. Review the staged rows, use **Rollback** to discard fetched changes, or **Download** to save the result as a timestamped CSV.
6. Select **Detach** to close the current CSV and start over.

Fetching runs in the browser and uses the storefront's public product endpoints. The store must be reachable from the browser and allow the required cross-origin requests. The app does not ask for a Shopify Admin API token.

The table and downloaded CSV use the configured output columns. The `Handle` column is protected from fetched-value overrides; fetched values, including empty values, replace other existing values. Additional rows are added when a product has more variants or media than the imported CSV. Configuration is saved in browser `localStorage` under `spf_app_settings`.

Fetch options include publishing fetched products, choosing whether inventory can continue when out of stock, adding or removing a handle suffix during fetch, and appending product tags.

### Product data CLI

The CLI in `scripts/cli` fetches product data from Shopify sitemaps or storefronts and transforms Shopify product data and CSV files. Run it from the project root:

```sh
node scripts/cli/cli.js --help
```

Available commands:

| Command | Purpose |
| --- | --- |
| `sitemap <sitemapUrl>` | Download product JSON or HTML files listed in a Shopify sitemap. |
| `tocsv <sourceDir>` | Convert downloaded product JSON files to a Shopify-format CSV. Matching HTML files in the directory provide page content and SEO data. |
| `fetch <originCsv>` | Refresh products listed in a CSV from a storefront or from a local directory of downloaded JSON/HTML pairs, then write a merged CSV. |
| `filter <source>` | Keep CSV rows for selected handles, wildcard patterns, or regular expressions. |
| `map-tag-gender <originCsv>` | Regenerate product tags and gender columns from an existing CSV without fetching products. |
| `group-to-one-json <sourceDir>` | Combine JSON files in a directory into one JSON array. |

Examples:

```sh
# Download product JSON files from a Shopify sitemap
node scripts/cli/cli.js sitemap https://store.example.com/sitemap.xml --output ./data/products

# Convert downloaded JSON files to CSV
node scripts/cli/cli.js tocsv ./data/products --output ./data/products.csv

# Refresh a CSV from the storefront
node scripts/cli/cli.js fetch ./data/products.csv --store-origin https://store.example.com --output ./data/refreshed.csv

# Or refresh from previously downloaded JSON and HTML files (one pair per handle)
node scripts/cli/cli.js fetch ./data/products.csv --local-source ./data/products --output ./data/refreshed.csv

# Keep handles matching a wildcard pattern
node scripts/cli/cli.js filter ./data/products.csv --pattern "*-preorder" --output ./data/preorders.csv
```

Common options (`-o, --output` is required by every command except `filter`, which defaults to `<source>_filtered.csv`):

| Command | Options |
| --- | --- |
| `sitemap` | `-m, --mode <json\|html>` (default `json`); `-r, --rate-limit <n>` concurrent requests per batch (default `5`); `-b, --rate-breaker <n>` pause in milliseconds between batches (default `500`; the built-in help text describes it as a request count). |
| `fetch` | `-s, --store-origin <url>`, `-L, --local-source <path>` (one of the two is required; local source wins), `--only <columns>`. |
| `filter` | `-d, --handle <handles>`, `-p, --pattern <pattern>`, `-r, --regex <pattern>`, `--not-match` (inverts `--regex`); at least one of handle, pattern, or regex is required, and a row is kept if it matches any of them. |
| `tocsv`, `map-tag-gender`, `group-to-one-json` | Only `-o, --output`. |

Use `sitemap --mode html` to download HTML pages. To use the local-source `fetch` command, the source directory must contain both `<handle>.json` and `<handle>.html` for each product. `fetch --only` accepts a comma-separated list of columns; protected and required columns are included automatically. See each command's help for all options, for example `node scripts/cli/cli.js fetch --help`.

### Shopify Admin CLI

The separate CLI in `scripts/admin` uses the Shopify Admin GraphQL API to query and create or update collections, create menus, and query, create, or update pages.

Before running Admin API commands:

1. Create `.env/.env.prd` in the project root with `SHOPIFY_SHOP`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES`, and `SHOPIFY_REDIRECT_URI`. `PORT` and `SHOPIFY_API_VERSION` are optional.
2. Make sure the HTTPS certificate and key required by the local OAuth callback are available at `scripts/admin/cert/server.cert` and `scripts/admin/cert/server.key`.
3. Run the OAuth flow to install the app and save its access token:

   ```sh
   node scripts/admin/auth.mjs
   ```

   The token is written to `scripts/admin/data/access-token.json`, which is ignored by Git.
4. Inspect command options:

   ```sh
   node scripts/admin/index.mjs --help
   node scripts/admin/index.mjs collection --help
   node scripts/admin/index.mjs page --help
   ```

Examples:

```sh
# Query collections into an existing directory
node scripts/admin/index.mjs collection query ./data/collections

# Query selected pages into an existing directory
node scripts/admin/index.mjs page query ./data/pages about-us,contact

# Preview page creation from an HTML file without making an API mutation
node scripts/admin/index.mjs page create ./data/pages/about-us.html --dry-run
```

| Command | Purpose and options |
| --- | --- |
| `collection create <file>` | Create collections from a JSON file. `--chunk-size <n>` (default `10`), `--delay-ms <n>` (default `500`). |
| `collection update <file>` | Update collections (matched by handle) from a JSON file; same options as `create`. |
| `collection query <source> [handles]` | Query collections by comma-separated handles, `-t, --title <pattern>` (wildcards supported), or all collections. |
| `collection to-csv <source> [props]` | Convert `<source>/collections.json` to CSV. `-o, --output <file>`; `[props]` is a comma-separated column list. |
| `menu create <file>` | Create menus from a JSON file. |
| `page create <source>` | Create pages from an `.html` file or directory. `--dry-run`. |
| `page update <source>` | Update pages listed in `<source>/store.json`. `-t, --title <pattern>`, `-d, --handle <handle>`, `--dry-run`. |
| `page query <source> [handles]` | Download page bodies by comma-separated handles, or all pages. |

Every command accepts the global option `-a, --auth <file>`. Admin commands use `scripts/admin/data/access-token.json` by default. Supply `--auth <file>` to use a different token file. Collection create/update inputs and menu inputs are JSON files; page commands work with HTML files and directories. Collection queries produce `collections.json` and `collection-resource-ids.json`; page queries produce HTML files and a `store.json` manifest. Menu query and update commands are not implemented yet.

## Development

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL when the server starts.

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Run the TypeScript project build, then create the static site in `web/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run lint:fix` | Run ESLint and apply supported fixes. |

The GitHub Pages workflow deploys the contents of `web/` on pushes to `master` or when manually triggered from GitHub Actions.

## Project layout

```text
src/                  React app, UI components, Shopify fetching and CSV mapping
scripts/cli/          Product sitemap, CSV, and JSON command-line tools
scripts/admin/        Shopify Admin GraphQL commands and OAuth flow
src/shared/json/      Shared CSV column and tag-mapping configuration
public/               Static logos and icons
web/                  Built static site used by the Pages workflow
```
