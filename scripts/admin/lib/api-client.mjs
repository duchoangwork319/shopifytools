// lib/api-client.mjs
// Shared axios client for the Shopify Admin GraphQL API. Request/response
// interceptors inject the access token and shared headers, and normalize
// HTTP failures into a single Error shape, so callers just call
// `graphqlRequest(client, query, variables)`.
import axios from 'axios';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

export function loadEnv(cwd = process.cwd()) {
  config({ path: path.resolve(cwd, '.env', '.env.prd') });
}

export function readAuth(authFile) {
  if (!fs.existsSync(authFile)) {
    console.error(`Missing access token file: ${authFile}. Run auth.mjs first.`);
    process.exit(1);
  }
  const { shop, access_token: accessToken } = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  if (!shop || !accessToken) {
    console.error(`${authFile} is missing "shop" or "access_token". Run auth.mjs first.`);
    process.exit(1);
  }
  return { shop, accessToken };
}

// Creates an axios instance scoped to a shop's Admin GraphQL endpoint. The
// access token and content-type header are injected via a request
// interceptor rather than passed at every call site.
export function createAdminApiClient({ shop, accessToken, apiVersion } = {}) {
  const resolvedVersion = apiVersion || process.env.SHOPIFY_API_VERSION || '2026-04';

  const client = axios.create({
    baseURL: `https://${shop}/admin/api/${resolvedVersion}`,
  });

  client.interceptors.request.use((requestConfig) => {
    requestConfig.headers['X-Shopify-Access-Token'] = accessToken;
    requestConfig.headers['Content-Type'] = 'application/json';
    return requestConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        throw new Error(`GraphQL HTTP error ${status}: ${text}`);
      }
      throw error;
    },
  );

  return client;
}

// POSTs a GraphQL query/variables pair and returns the parsed body
// ({ data, errors? }), same shape as the raw fetch-based scripts returned.
export async function graphqlRequest(client, query, variables) {
  const response = await client.post('/graphql.json', { query, variables });
  return response.data;
}
