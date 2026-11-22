/**
 * Node-only helper: build a client from environment variables.
 * Kept out of `index.ts` so browser bundles never touch `process`.
 *
 *   FUSION_API_USER, FUSION_API_PASSWORD, [FUSION_API_BASE_URL]
 */
import { config as loadDotenv } from 'dotenv';
import { FusionClient, type FusionClientConfig } from './client.ts';

export function createClientFromEnv(overrides: Partial<FusionClientConfig> = {}): FusionClient {
  loadDotenv({ quiet: true });
  const username = overrides.username ?? process.env.FUSION_API_USER;
  const password = overrides.password ?? process.env.FUSION_API_PASSWORD;
  if (!username || !password) {
    throw new Error('Set FUSION_API_USER and FUSION_API_PASSWORD (e.g. in .env).');
  }
  return new FusionClient({
    baseUrl: process.env.FUSION_API_BASE_URL || undefined,
    ...overrides,
    username,
    password,
  });
}
