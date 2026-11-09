#!/usr/bin/env node
// index.mjs
// CLI entry point wiring the admin library scripts (create/update/query
// collections, create menus) into a single `commander`-based tool with
// `collection`, `menu`, and `page` sub-commands, each nesting `create`,
// `update`, `query`.
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { performance } from 'node:perf_hooks';
import { createAdminApiClient, loadEnv, readAuth } from './lib/api-client.mjs';
import { resourceIdsFileFor } from './lib/io.mjs';
import { FOLDER } from './lib/constants.mjs';
import { createCollections, DEFAULT_CHUNK_SIZE as CREATE_CHUNK_SIZE, DEFAULT_DELAY_MS as CREATE_DELAY_MS } from './collection/create.mjs';
import { updateCollections } from './collection/update.mjs';
import { queryCollections } from './collection/query.mjs';
import { collectionsToCsv } from './to-csv-collections.mjs';
import { loadCsvCollections } from './load-csv-collections.mjs';
import { createMenus } from './menu/create.mjs';
import { queryMenus } from './menu/query.mjs';
import { updateMenus } from './menu/update.mjs';
import { createPages } from './page/create.mjs';
import { queryPages } from './page/query.mjs';
import { updatePages } from './page/update.mjs';
import { deletePages } from './page/delete.mjs';
import { queryMetafieldDefinitions } from './system/metafield/query.mjs';
import { createMetafieldDefinitions } from './system/metafield/create.mjs';
import { queryProducts } from './product/query.mjs';
import { updateProducts } from './product/update.mjs';

loadEnv();

const DEFAULT_AUTH_FILE = path.resolve(import.meta.dirname, 'data', 'access-token.json');

// Builds an Admin API client from the -a/--auth option, resolving the path
// with path.resolve (never path.isAbsolute / path.join(dirname, ...)). `cmd`
// is the Commander command instance passed as the last action() argument -
// optsWithGlobals() merges it with the root-level -a/--auth option.
function clientFromCommand(cmd) {
  const { auth } = cmd.optsWithGlobals();
  const authFile = path.resolve(auth);
  const { shop, accessToken } = readAuth(authFile);
  return createAdminApiClient({ shop, accessToken });
}

function exitOnErrors({ hadErrors }) {
  if (hadErrors) process.exitCode = 1;
}

// Renders a millisecond duration as "<minutes>m <seconds>s", e.g. "2m 7.483s".
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = (ms % 60000) / 1000;
  return `${minutes}m ${seconds.toFixed(3)}s`;
}

// Resolves <source> - the one main data folder shared by every business
// object - after validating it's an existing directory. Returns null (and
// sets process.exitCode) instead of exiting outright, so callers can
// `return` out of their action cleanly.
function resolveMainDir(source) {
  const mainDir = path.resolve(source);
  if (!fs.existsSync(mainDir) || !fs.statSync(mainDir).isDirectory()) {
    console.error(`Source must be an existing directory: ${mainDir}`);
    process.exitCode = 1;
    return null;
  }
  return mainDir;
}

// Resolves a business object's own subfolder (e.g. FOLDER.COLLECTION) inside
// <source>, validating <source> itself first.
function resolveBusinessDir(source, folder) {
  const mainDir = resolveMainDir(source);
  return mainDir ? path.join(mainDir, folder) : null;
}

const program = new Command();
program
  .name('admin')
  .description('Shopify admin data CLI (collections, menus, pages)')
  // Defined once on the root command so every sub-command inherits it
  // (via cmd.optsWithGlobals()), regardless of where -a is placed on the
  // command line.
  .option('-a, --auth <file>', 'path to access-token.json', DEFAULT_AUTH_FILE)
  // Commander only lists a command's own options in its --help, not an
  // ancestor's - `afterAll` re-prints this note on every level's help
  // output so -a/--auth stays visible from `-h` down to the deepest
  // sub-command.
  .addHelpText(
    'afterAll',
    '\nGlobal Options:\n' +
    `  -a, --auth <file>  path to access-token.json (default: "${DEFAULT_AUTH_FILE}")`,
  )
  // Times every command's action() callback with the Performance API -
  // preAction stamps the start time onto the action command itself (so
  // nested/concurrent invocations can't clobber each other's start time),
  // postAction reads it back and logs the elapsed time.
  .hook('preAction', (thisCommand, actionCommand) => {
    actionCommand.__startTime = performance.now();
  })
  .hook('postAction', (thisCommand, actionCommand) => {
    const elapsedMs = performance.now() - actionCommand.__startTime;
    console.log(`\nExecution time: ${formatDuration(elapsedMs)}`);
  });

// ---------------------------------------------------------------------------
// collection
// ---------------------------------------------------------------------------
const collection = program.command('collection').description('manage collections');

collection
  .command('create <file>')
  .description('create collections from a CollectionCreateInput JSON file')
  .option('--chunk-size <n>', 'collections per GraphQL request', String(CREATE_CHUNK_SIZE))
  .option('--delay-ms <n>', 'delay between chunk requests, in ms', String(CREATE_DELAY_MS))
  .action(async (file, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const collectionsFile = path.resolve(file);
    const resourceIdsFile = resourceIdsFileFor(collectionsFile);
    const result = await createCollections({
      client,
      collectionsFile,
      resourceIdsFile,
      chunkSize: Number(opts.chunkSize),
      delayMs: Number(opts.delayMs),
    });
    exitOnErrors(result);
  });

collection
  .command('update <source> [handles]')
  .description(
    'update collections from <source>/collection/_searchable-attrs.json (the per-collection JSON files ' +
    'written by "collection query"), by comma-separated handles, or every entry if omitted',
  )
  .option(
    '--update-rules',
    'also update smart collection rules (ruleSet) - skipped by default since it changes collection membership',
    false,
  )
  .option('--update-metafields', 'also push each collection\'s metafields via metafieldsSet (a separate request per collection)', false)
  .option('--dry-run', 'log what would be updated without calling the API', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.COLLECTION);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    const result = await updateCollections({
      client,
      sourceDir,
      handles: handleList,
      updateRules: opts.updateRules,
      includeMetafields: opts.updateMetafields,
      dryRun: opts.dryRun,
    });
    exitOnErrors(result);
  });

collection
  .command('query <source> [handles]')
  .description(
    'fetch collection(s) by comma-separated handles, by -t/--title search (wildcard supported), ' +
    'or all collections if neither is given, writing <source>/collection/<handle>.json and ' +
    '<source>/collection/_resource-ids.json',
  )
  .option('-t, --title <pattern>', 'search collections by title (wildcard supported, e.g. "*summer*")')
  .option('--with-metafields', 'also fetch each collection\'s metafields (a separate, paged request per collection)', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.COLLECTION);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    await queryCollections({
      client,
      sourceDir,
      handles: handleList,
      title: opts.title,
      includeMetafields: opts.withMetafields,
    });
  });

collection
  .command('to-csv <source> [props]')
  .description(
    'convert <source>/collection/collections.json to a CSV, with columns from the comma-separated ' +
    '[props] (e.g. "handle,title"); defaults to every key on the first collection',
  )
  .option('-o, --output <file>', 'path to write the CSV to (default: <source>/collection/collections.csv)')
  .action((source, props, opts) => {
    const sourceDir = resolveBusinessDir(source, FOLDER.COLLECTION);
    if (!sourceDir) return;
    const propList = props ? props.split(',').map((p) => p.trim()).filter(Boolean) : [];
    collectionsToCsv({ sourceDir, props: propList, output: opts.output });
  });

collection
  .command('load-csv <csvPath> <source>')
  .description(
    'merge a CSV file (header row incl. "handle") into each matching <source>/collection/<handle>.json ' +
    'collection file; also updates title in <source>/collection/_searchable-attrs.json when the CSV has a title column',
  )
  .action((csvPath, source) => {
    const csvFile = path.resolve(csvPath);
    if (!fs.existsSync(csvFile) || !fs.statSync(csvFile).isFile()) {
      console.error(`CSV path must be an existing file: ${csvFile}`);
      process.exitCode = 1;
      return;
    }
    const sourceDir = resolveBusinessDir(source, FOLDER.COLLECTION);
    if (!sourceDir) return;
    loadCsvCollections({ csvFile, sourceDir });
  });

// ---------------------------------------------------------------------------
// menu
// ---------------------------------------------------------------------------
const menu = program.command('menu').description('manage navigation menus');

menu
  .command('create <source> [handles]')
  .description(
    'create menu(s) from <source>/menu/<handle>.json menu inputs, by comma-separated handles, or ' +
    'every one found in <source>/menu if omitted - collection-linked items are resolved via ' +
    '<source>/collection/_resource-ids.json',
  )
  .option('--dry-run', 'log what would be created without calling the API', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const mainDir = resolveMainDir(source);
    if (!mainDir) return;
    const sourceDir = path.join(mainDir, FOLDER.MENU);
    const collectionSourceDir = path.join(mainDir, FOLDER.COLLECTION);
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    const result = await createMenus({
      client,
      sourceDir,
      collectionSourceDir,
      handles: handleList,
      dryRun: opts.dryRun,
    });
    exitOnErrors(result);
  });

menu
  .command('query <source> [handles]')
  .description(
    'fetch menu(s) by comma-separated handles, or all menus if omitted, writing <source>/menu/<handle>.json, ' +
    '<source>/menu/_searchable-attrs.json, and <source>/menu/_resource-ids.json',
  )
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.MENU);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    await queryMenus({ client, sourceDir, handles: handleList });
  });

menu
  .command('update <source> [handles]')
  .description(
    'update menu(s) from <source>/menu/_searchable-attrs.json (the per-menu JSON files written by ' +
    '"menu query"), by comma-separated handles, or every entry if omitted',
  )
  .option('-t, --title <pattern>', 'match menus by title - a full title, a wildcard (*, ?), or a /regex/flags')
  .option('--dry-run', 'log what would be updated without calling the API', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.MENU);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    const result = await updateMenus({
      client,
      sourceDir,
      handles: handleList,
      title: opts.title,
      dryRun: opts.dryRun,
    });
    if (result.failed) process.exitCode = 1;
  });

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
const page = program.command('page').description('manage pages');

page
  .command('create <source>')
  .description(
    'create page(s) from every *.html file in <source>/page. ' +
    'Skips handles already recorded in <source>/page/_searchable-attrs.json.',
  )
  .option('--dry-run', 'log what would be created without calling the API or writing _searchable-attrs.json', false)
  .action(async (source, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const pagesDir = resolveBusinessDir(source, FOLDER.PAGE);
    if (!pagesDir) return;
    if (!fs.existsSync(pagesDir)) {
      console.error(`No ${FOLDER.PAGE} folder found in ${path.resolve(source)}. Create ${pagesDir} and add .html files to it.`);
      process.exitCode = 1;
      return;
    }
    const result = await createPages({ client, source: pagesDir, dryRun: opts.dryRun });
    if (result.failed) process.exitCode = 1;
  });

page
  .command('update <source> [handles]')
  .description(
    'update page(s) from <source>/page/_searchable-attrs.json by comma-separated handles, by -t/--title ' +
    '(wildcard supported), or every entry if neither is given',
  )
  .option('-t, --title <pattern>', 'match pages by title - a full title, a wildcard (*, ?), or a /regex/flags')
  .option('--dry-run', 'log what would be updated without calling the API', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.PAGE);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    const result = await updatePages({ client, sourceDir, handles: handleList, title: opts.title, dryRun: opts.dryRun });
    if (result.failed) process.exitCode = 1;
  });

page
  .command('query <source> [handles]')
  .description(
    'fetch page(s) by comma-separated handles (or all pages if omitted), ' +
    'writing each body to <source>/page/<handle>.html and the entries to <source>/page/_searchable-attrs.json',
  )
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.PAGE);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    await queryPages({ client, sourceDir, handles: handleList });
  });

page
  .command('delete <source> [handles]')
  .description(
    'delete page(s) from <source>/page/_searchable-attrs.json by comma-separated handles, or every entry ' +
    'if omitted; removes each deleted one from _searchable-attrs.json',
  )
  .option('--delete-html', 'also delete each page\'s bodyFilePath from disk', false)
  .option('--dry-run', 'log what would be deleted without calling the API', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.PAGE);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    const result = await deletePages({ client, sourceDir, handles: handleList, deleteHtml: opts.deleteHtml, dryRun: opts.dryRun });
    if (result.failed) process.exitCode = 1;
  });

// ---------------------------------------------------------------------------
// product
// ---------------------------------------------------------------------------
const product = program.command('product').description('manage products');

product
  .command('query <source>')
  .description(
    'fetch every product (via a bulk operation) with its variants + metafields, writing ' +
    `<source>/${FOLDER.PRODUCT}/<handle>.json and <source>/${FOLDER.PRODUCT}/_resource-ids.json`,
  )
  .action(async (source, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.PRODUCT);
    if (!sourceDir) return;
    await queryProducts({ client, sourceDir });
  });

product
  .command('update <source> [handles]')
  .description(
    `update product(s) from <source>/${FOLDER.PRODUCT}/<handle>.json (the files written by "product query"), ` +
    'by comma-separated handles, by -t/--title (wildcard supported), or every entry if neither is given',
  )
  .option('-t, --title <pattern>', 'match products by title - a full title, a wildcard (*, ?), or a /regex/flags')
  .option(
    '--update-metafields',
    'push each variant\'s metafields via metafieldsSet - currently the only data this command can update; ' +
    'without this flag nothing is updated (use the CSV-based "product import" for product data itself)',
    false,
  )
  .option('--dry-run', 'log what would be updated without calling the API', false)
  .option('--sleep <ms>', 'milliseconds to pause after each product, to stay under the API rate limit', '0')
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.PRODUCT);
    if (!sourceDir) return;
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    const result = await updateProducts({
      client,
      sourceDir,
      handles: handleList,
      title: opts.title,
      includeMetafields: opts.updateMetafields,
      dryRun: opts.dryRun,
      sleepMs: Number(opts.sleep),
    });
    exitOnErrors(result);
  });

// ---------------------------------------------------------------------------
// system
// ---------------------------------------------------------------------------
const system = program.command('system').description('manage shared config (metafield definitions, etc.)');
const systemMetafield = system.command('metafield').description('manage metafield definitions');

systemMetafield
  .command('query <source> <ownerType>')
  .description(
    'fetch every metafield definition for a MetafieldOwnerType (e.g. "collection", "product"), ' +
    `writing/updating <source>/${FOLDER.SYSTEM.METAFIELD}/<ownerType>.json`,
  )
  .action(async (source, ownerType, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.SYSTEM.METAFIELD);
    if (!sourceDir) return;
    await queryMetafieldDefinitions({ client, sourceDir, ownerType });
  });

systemMetafield
  .command('create <source> <ownerType>')
  .description(
    `create every metafield definition with no "id" in <source>/${FOLDER.SYSTEM.METAFIELD}/<ownerType>.json ` +
    '(the file written by "system metafield query"), writing each created id back into it',
  )
  .option('--dry-run', 'log what would be created without calling the API', false)
  .action(async (source, ownerType, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = resolveBusinessDir(source, FOLDER.SYSTEM.METAFIELD);
    if (!sourceDir) return;
    const result = await createMetafieldDefinitions({ client, sourceDir, ownerType, dryRun: opts.dryRun });
    exitOnErrors(result);
  });

program.parseAsync(process.argv);
