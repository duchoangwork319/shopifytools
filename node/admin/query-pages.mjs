// query-pages.mjs
// Library: queries pages from the Admin GraphQL API, either all of them
// (paged) or a single one by handle.
import fs from 'fs';
import path from 'path';
import { graphqlRequest } from './lib/api-client.mjs';
import { writeJsonFile } from './lib/io.mjs';

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
// one's body to `<dirname(pagesFile)>/<handle>.html`, and writes the
// resulting { handle, title, bodyFilePath } entries to pagesFile. pagesFile
// is purely an output - its existing content, if any, is not read.
export async function queryPages({ client, pagesFile, handles }) {
  const bodyOutputDir = path.dirname(pagesFile);
  fs.mkdirSync(bodyOutputDir, { recursive: true });

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

  const entries = remotePages.map((remotePage) => {
    const bodyFilePath = path.resolve(bodyOutputDir, "body", `${remotePage.handle}.html`);
    fs.mkdirSync(path.dirname(bodyFilePath), { recursive: true });
    fs.writeFileSync(bodyFilePath, remotePage.body || '', 'utf8');
    console.log(`Saved body for "${remotePage.handle}" to ${bodyFilePath}`);
    return { handle: remotePage.handle, title: remotePage.title, bodyFilePath };
  });

  writeJsonFile(pagesFile, entries);

  return { count: entries.length };
}
