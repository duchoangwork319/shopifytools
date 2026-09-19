// auth.mjs
// Runs a local OAuth flow against the Shopify Admin API: opens the browser to
// `/admin/oauth/authorize`, and on `/auth/callback` exchanges the code for an
// access token, saves it to disk, then shuts itself down.
import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import open from 'open';
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const configPath = path.join(cwd, '.env', '.env.prd');

// 1. Read your SSL certificate and key files
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'server.cert'))
};

console.log(`Loading environment variables from ${configPath}`);
config({ path: configPath });

const {
  SHOPIFY_SHOP,
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_REDIRECT_URI,
  PORT,
} = process.env;

const port = PORT || 3000;
const tokenFile = path.join(__dirname, 'data', 'access-token.json');

const requiredEnv = {
  SHOPIFY_SHOP,
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_REDIRECT_URI,
};
for (const [key, value] of Object.entries(requiredEnv)) {
  if (!value) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

// In-memory is fine here - this process only lives for a single OAuth run.
const stateStore = new Map(); // state -> shop

const app = express();

app.get('/auth', (req, res) => {
  const shop = req.query.shop || SHOPIFY_SHOP;
  if (!shop) return res.status(400).send('Missing shop parameter');

  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, shop);

  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set('client_id', SHOPIFY_API_KEY);
  url.searchParams.set('scope', SHOPIFY_SCOPES);
  url.searchParams.set('redirect_uri', SHOPIFY_REDIRECT_URI);
  url.searchParams.set('state', state);

  res.redirect(url.toString());
});

app.get('/auth/callback', async (req, res) => {
  const { shop, code, state } = req.query;
  if (!shop || !code || !state) {
    return res.status(400).send('Missing required query params');
  }

  const expectedShop = stateStore.get(state);
  if (!expectedShop || expectedShop !== shop) {
    return res.status(400).send('Invalid state');
  }
  stateStore.delete(state);

  try {
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      return res.status(500).send(`Failed to get access token: ${text}`);
    }

    const { access_token, scope } = await tokenResponse.json();

    fs.mkdirSync(path.dirname(tokenFile), { recursive: true });
    fs.writeFileSync(
      tokenFile,
      JSON.stringify({ shop, access_token, scope, created_at: new Date().toISOString() }, null, 2),
    );

    res.type('json').send(JSON.stringify({
      message: `App installed for ${shop}. Access token saved to ${path.relative(process.cwd(), tokenFile)}`,
    }, null, 2));
  } catch (err) {
    console.error(err);
    return res.status(500).send('OAuth error');
  } finally {
    res.on('finish', () => {
      console.log('Access token saved. Shutting down.');
      server.close(() => process.exit(0));
    });
  }
});

const server = https.createServer(httpsOptions, app).listen(port, async () => {
  console.log(`Auth server listening on https://localhost:${port}`);
  const authUrl = `https://localhost:${port}/auth?shop=${encodeURIComponent(SHOPIFY_SHOP)}`;
  console.log(`Opening browser to ${authUrl}`);
  await open(authUrl);
});
