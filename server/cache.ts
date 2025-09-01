import dotenv from 'dotenv';
dotenv.config();

let Redis: any = null;
let client: any = null;
try {
  // dynamic require to avoid hard dependency in test environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Redis = require('ioredis');
} catch (e) {
  Redis = null;
}
const url = process.env.REDIS_URL;
if (Redis && url) {
  client = new Redis(url);
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!client) return null;
  return await client.get(key);
}

export async function cacheSet(key: string, value: string, ttlSec?: number): Promise<void> {
  if (!client) return;
  if (ttlSec) await client.set(key, value, 'EX', ttlSec);
  else await client.set(key, value);
}

export function isCacheEnabled() { return !!client; }
