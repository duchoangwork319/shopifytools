#!/usr/bin/env node
// index.mjs
// CLI entry point wiring the admin library scripts (create/update/query
// collections, create menus) into a single `commander`-based tool with
// `collection`, `menu`, and `page` sub-commands, each nesting `create`,
// `update`, `query`.
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { createAdminApiClient, loadEnv, readAuth } from './lib/api-client.mjs';
import { resourceIdsFileFor } from './lib/io.mjs';
import { createCollections, DEFAULT_CHUNK_SIZE as CREATE_CHUNK_SIZE, DEFAULT_DELAY_MS as CREATE_DELAY_MS } from './create-collections.mjs';
import { updateCollections } from './update-collections.mjs';
import { queryCollections } from './query-collections.mjs';
import { collectionsToCsv } from './to-csv-collections.mjs';
import { loadCsvCollections } from './load-csv-collections.mjs';
import { createMenus } from './create-menus.mjs';
import { queryMenus } from './query-menus.mjs';
import { updateMenus } from './update-menus.mjs';
import { createPages } from './create-pages.mjs';
import { queryPages } from './query-pages.mjs';
import { updatePages } from './update-pages.mjs';
import { queryMetafieldDefinitions } from './query-metafield-def.mjs';

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
  );

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
    'update collections from <source>/store.json (the per-collection JSON files written by ' +
    '"collection query"), by comma-separated handles, or every entry if omitted',
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
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
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
    'or all collections if neither is given, writing <source>/collections.json and ' +
    '<source>/collection-resource-ids.json',
  )
  .option('-t, --title <pattern>', 'search collections by title (wildcard supported, e.g. "*summer*")')
  .option('--with-metafields', 'also fetch each collection\'s metafields (a separate, paged request per collection)', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
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
    'convert <source>/collections.json to a CSV, with columns from the comma-separated ' +
    '[props] (e.g. "handle,title"); defaults to every key on the first collection',
  )
  .option('-o, --output <file>', 'path to write the CSV to (default: <source>/collections.csv)')
  .action((source, props, opts) => {
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
    const propList = props ? props.split(',').map((p) => p.trim()).filter(Boolean) : [];
    collectionsToCsv({ sourceDir, props: propList, output: opts.output });
  });

collection
  .command('load-csv <csvPath> <source>')
  .description(
    'merge a CSV file (header row incl. "handle") into each matching <source>/<handle>.json ' +
    'collection file; also updates title in <source>/store.json when the CSV has a title column',
  )
  .action((csvPath, source) => {
    const csvFile = path.resolve(csvPath);
    if (!fs.existsSync(csvFile) || !fs.statSync(csvFile).isFile()) {
      console.error(`CSV path must be an existing file: ${csvFile}`);
      process.exitCode = 1;
      return;
    }
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
    loadCsvCollections({ csvFile, sourceDir });
  });

// ---------------------------------------------------------------------------
// menu
// ---------------------------------------------------------------------------
const menu = program.command('menu').description('manage navigation menus');

menu
  .command('create <source> [handles]')
  .description(
    'create menu(s) from <source>/<handle>.json menu inputs, by comma-separated handles, or ' +
    'every one found in <source> if omitted',
  )
  .requiredOption('--collection-source <dir>', 'folder containing collection-resource-ids.json')
  .option('--dry-run', 'log what would be created without calling the API', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
    const collectionSourceDir = path.resolve(opts.collectionSource);
    if (!fs.existsSync(collectionSourceDir) || !fs.statSync(collectionSourceDir).isDirectory()) {
      console.error(`--collection-source must be an existing directory: ${collectionSourceDir}`);
      process.exitCode = 1;
      return;
    }
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
    'fetch menu(s) by comma-separated handles, or all menus if omitted, writing <source>/<handle>.json, ' +
    '<source>/store.json, and <source>/menu-resource-ids.json',
  )
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = path.resolve(source);
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    await queryMenus({ client, sourceDir, handles: handleList });
  });

menu
  .command('update <source> [handles]')
  .description(
    'update menu(s) from <source>/menus.json (keyed by handle), by comma-separated ' +
    'handles, or every entry if omitted',
  )
  .option('--dryrun', 'log what would be updated without calling the API', false)
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    const result = await updateMenus({ client, sourceDir, handles: handleList, dryRun: opts.dryrun });
    if (result.failed) process.exitCode = 1;
  });

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
const page = program.command('page').description('manage pages');

page
  .command('create <source>')
  .description(
    'create page(s) from an .html file, or every *.html file in a directory. ' +
    'Skips handles already recorded in store.json next to <source>.',
  )
  .option('--dry-run', 'log what would be created without calling the API or writing store.json', false)
  .action(async (source, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const resolvedSource = path.resolve(source);
    const result = await createPages({ client, source: resolvedSource, dryRun: opts.dryRun });
    if (result.failed) process.exitCode = 1;
  });

page
  .command('update <source>')
  .description(
    'update page(s) from <source>/store.json. Narrows to one handle with -d, or to ' +
    'titles matching a pattern with -t; updates everything in store.json if neither is given.',
  )
  .option('-t, --title <pattern>', 'match pages by title - a full title, a wildcard (*, ?), or a /regex/flags')
  .option('-d, --handle <handle>', 'match a page by its exact, existing handle')
  .option('--dry-run', 'log what would be updated without calling the API', false)
  .action(async (source, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
    const result = await updatePages({ client, sourceDir, title: opts.title, handle: opts.handle, dryRun: opts.dryRun });
    if (result.failed) process.exitCode = 1;
  });

page
  .command('query <source> [handles]')
  .description(
    'fetch page(s) by comma-separated handles (or all pages if omitted), ' +
    'writing each body to <source>/<handle>.html and the entries to <source>/store.json',
  )
  .action(async (source, handles, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const sourceDir = path.resolve(source);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      console.error(`Source must be an existing directory: ${sourceDir}`);
      process.exitCode = 1;
      return;
    }
    const handleList = handles ? handles.split(',').map((h) => h.trim()).filter(Boolean) : [];
    await queryPages({ client, sourceDir, handles: handleList });
  });

// ---------------------------------------------------------------------------
// metafield-def
// ---------------------------------------------------------------------------
const metafieldDef = program.command('metafield-def').description('manage metafield definitions');

metafieldDef
  .command('query <ownerType>')
  .description(
    'fetch every metafield definition for a MetafieldOwnerType (e.g. "collection", "product"), ' +
    'writing config/metafields/<ownerType>.json',
  )
  .action(async (ownerType, opts, cmd) => {
    const client = clientFromCommand(cmd);
    await queryMetafieldDefinitions({ client, ownerType });
  });

program.parseAsync(process.argv);
