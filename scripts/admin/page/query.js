// page/query.js
// Library: queries pages from the Admin GraphQL API, either all of them
// (paged) or a single one by handle.
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { graphqlRequest } from '../lib/api-client.js';
import { readJsonFileIfExists, writeJsonFile } from '../lib/io.js';
import { FILE } from '../lib/constants.js';

const GET_ALL_PAGES_QUERY = `
  query GetAllPages($cursor: String) {
    pages(first: 100, after: $cursor) {
      edges {
        cursor
        node {
          id
          title
          handle
          body
          createdAt
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const GET_PAGE_BY_HANDLE_QUERY = `
  query GetPageByHandle($query: String!) {
    pages(first: 1, query: $query) {
      edges {
        node {
          id
          title
          handle
          body
          createdAt
        }
      }
    }
  }
`;

// Pages through all pages with body content.
export async function fetchAllPages(client) {
  let cursor = null;
  let hasNextPage = true;
  const allPages = [];

  while (hasNextPage) {
    const json = await graphqlRequest(client, GET_ALL_PAGES_QUERY, { cursor });

    if (json.errors) {
      console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL error');
    }

    const connection = json.data.pages;
    for (const edge of connection.edges) {
      allPages.push(edge.node);
      cursor = edge.cursor;
    }

    hasNextPage = connection.pageInfo.hasNextPage;
  }

  return allPages;
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

// Fetches a single page by its handle, or null if none matches.
export async function fetchPageByHandle(client, handle) {
  const json = await graphqlRequest(client, GET_PAGE_BY_HANDLE_QUERY, { query: `handle:'${handle}'` });

  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL error');
  }

  return json.data.pages.edges[0]?.node ?? null;
}

// Fetches pages (by `handles`, or all of them if omitted/empty), writes each
// one's body to `<sourceDir>/<handle>.html`, and writes the resulting
// { id, handle, title, bodyFilePath } entries to `<sourceDir>/_searchable-attrs.json`.
// The store file is purely an output - its existing content, if any, is not
// read.
export async function queryPages({ client, sourceDir, handles }) {
  fs.mkdirSync(sourceDir, { recursive: true });

  let remotePages;
  if (handles?.length) {
    remotePages = [];
    for (const handle of handles) {
      const remotePage = await fetchPageByHandle(client, handle);
      if (!remotePage) {
        console.warn(`No page found for handle "${handle}" - skipping.`);
        continue;
      }
      remotePages.push(remotePage);
    }
  } else {
    remotePages = await fetchAllPages(client);
  }

  const storeFile = path.resolve(sourceDir, FILE.SEARCHABLE_ATTRS);
  const previousEntries = readJsonFileIfExists(storeFile, []);
  const previousHandles = new Set(previousEntries.map((entry) => entry.handle));

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  const entries = remotePages.map((remotePage) => {
    const bodyFilePath = path.resolve(sourceDir, `${remotePage.handle}.html`);
    const newBody = remotePage.body || '';
    const isNew = !previousHandles.has(remotePage.handle);

    const existingBody = !isNew && fs.existsSync(bodyFilePath) ? fs.readFileSync(bodyFilePath, 'utf8') : null;
    const changed = isNew || existingBody === null || sha256(existingBody) !== sha256(newBody);

    if (changed) {
      fs.writeFileSync(bodyFilePath, newBody, 'utf8');
      console.log(`Saved body for "${remotePage.handle}" to ${bodyFilePath}`);
    }

    if (isNew) {
      newCount += 1;
    } else if (changed) {
      updatedCount += 1;
    } else {
      unchangedCount += 1;
    }

    return { id: remotePage.id, handle: remotePage.handle, title: remotePage.title, bodyFilePath };
  });

  writeJsonFile(storeFile, entries);

  console.log(`\nNew: ${newCount}, Updated: ${updatedCount}, Unchanged: ${unchangedCount}`);

  return { count: entries.length, newCount, updatedCount, unchangedCount };
}
