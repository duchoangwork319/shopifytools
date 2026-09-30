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
import { updateCollections, DEFAULT_CHUNK_SIZE as UPDATE_CHUNK_SIZE, DEFAULT_DELAY_MS as UPDATE_DELAY_MS } from './update-collections.mjs';
import { listSmartCollections } from './query-collections.mjs';
import { queryCollectionsWildcard } from './query-collections-wildcard.mjs';
import { createMenus } from './create-menus.mjs';
import { createPages } from './create-pages.mjs';
import { queryPages } from './query-pages.mjs';

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
  .command('update <file>')
  .description('update collections from a CollectionInput JSON file (keyed by handle)')
  .option('--chunk-size <n>', 'collections per GraphQL request', String(UPDATE_CHUNK_SIZE))
  .option('--delay-ms <n>', 'delay between chunk requests, in ms', String(UPDATE_DELAY_MS))
  .action(async (file, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const collectionsFile = path.resolve(file);
    const resourceIdsFile = resourceIdsFileFor(collectionsFile);
    const result = await updateCollections({
      client,
      collectionsFile,
      resourceIdsFile,
      chunkSize: Number(opts.chunkSize),
      delayMs: Number(opts.delayMs),
    });
    exitOnErrors(result);
  });

collection
  .command('query <file> [titleWildcard]')
  .description(
    'without titleWildcard: list all smart collections (with a ruleSet). ' +
    'with titleWildcard (e.g. "*summer*"): search by title and append new collections to <file>',
  )
  .action(async (file, titleWildcard, opts, cmd) => {
    const client = clientFromCommand(cmd);
    if (!titleWildcard) {
      await listSmartCollections({ client });
      return;
    }
    const collectionsFile = path.resolve(file);
    const resourceIdsFile = resourceIdsFileFor(collectionsFile);
    await queryCollectionsWildcard({ client, collectionsFile, resourceIdsFile, titleWildcard });
  });

// ---------------------------------------------------------------------------
// menu
// ---------------------------------------------------------------------------
const menu = program.command('menu').description('manage navigation menus');

menu
  .command('create <file>')
  .description('create menu(s) from a menuCreate input JSON file')
  .action(async (file, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const menuInputFile = path.resolve(file);
    const resourceIdsFile = resourceIdsFileFor(menuInputFile);
    const result = await createMenus({ client, menuInputFile, resourceIdsFile });
    exitOnErrors(result);
  });

menu.command('update <file>').description('not implemented yet').action(() => {
  console.log('menu update: not implemented yet');
});

menu.command('query [file]').description('not implemented yet').action(() => {
  console.log('menu query: not implemented yet');
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
  .option('-d, --dry-run', 'log what would be created without calling the API or writing store.json', false)
  .action(async (source, opts, cmd) => {
    const client = clientFromCommand(cmd);
    const resolvedSource = path.resolve(source);
    const result = await createPages({ client, source: resolvedSource, dryRun: opts.dryRun });
    if (result.failed) process.exitCode = 1;
  });

page.command('update <file>').description('not implemented yet').action(() => {
  console.log('page update: not implemented yet');
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

program.parseAsync(process.argv);
