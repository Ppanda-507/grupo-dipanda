import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export const CONTACT_WINDOW_SECONDS = 900;

export function normalizeAddress(address) {
  if (typeof address !== 'string' || !isIP(address)) return null;
  if (address.startsWith('::ffff:') && isIP(address.slice(7)) === 4) return address.slice(7);
  // Treat an IPv6 /64 as one sender to reduce trivial address rotation.
  if (isIP(address) === 6) {
    const canonical = new URL(`http://[${address}]`).hostname.slice(1, -1);
    const halves = canonical.split('::');
    const left = halves[0] ? halves[0].split(':') : [];
    const right = halves[1] ? halves[1].split(':') : [];
    const groups = halves.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left;
    return groups.slice(0, 4).map(group => group.padStart(4, '0')).join(':') + '::/64';
  }
  return address;
}

export function createMemoryLimiter({ clock = Date.now, maxEntries = 10000 } = {}) {
  const entries = new Map();
  return async address => {
    const key = normalizeAddress(address);
    if (!key) return { status: 503 };
    const now = clock();
    for (const [key, value] of entries) if (value.expires <= now) entries.delete(key);
    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= maxEntries) return { status: 503 };
      entry = { count: 0, expires: now + CONTACT_WINDOW_SECONDS * 1000 };
      entries.set(key, entry);
    }
    // Reserve synchronously before body reads or provider calls can yield.
    if (++entry.count > 6) return { status: 429, retryAfter: Math.ceil((entry.expires - now) / 1000) };
    return { status: 200 };
  };
}

const script = `
local ip = redis.call('INCR', KEYS[1])
if ip == 1 then redis.call('EXPIRE', KEYS[1], 900) end
if ip > 6 then return {429, redis.call('TTL', KEYS[1])} end
local total = redis.call('INCR', KEYS[2])
if total == 1 then redis.call('EXPIRE', KEYS[2], 86400) end
if total > 100 then return {429, redis.call('TTL', KEYS[2])} end
return {200, 0}`;

export function createDurableLimiter(environment = process.env, fetcher = fetch) {
  return async address => {
    const ip = normalizeAddress(address);
    const secret = environment.RATE_LIMIT_KEY_SECRET;
    let endpoint;
    try { endpoint = new URL(environment.UPSTASH_REDIS_REST_URL); } catch { return { status: 503 }; }
    if (!ip || typeof secret !== 'string' || secret.length < 32 || !environment.UPSTASH_REDIS_REST_TOKEN || endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.upstash.io') || endpoint.username || endpoint.password || endpoint.port || endpoint.search || endpoint.hash || endpoint.pathname !== '/') return { status: 503 };
    const key = createHmac('sha256', secret).update(ip).digest('hex');
    try {
      const response = await fetcher(endpoint.origin, {
        method: 'POST', redirect: 'error',
        headers: { Authorization: `Bearer ${environment.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EVAL', script, '2', `dipanda:contact:ip:${key}`, 'dipanda:contact:daily']),
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return { status: 503 };
      const data = await response.json();
      if (data.error || !Array.isArray(data.result) || ![200, 429].includes(data.result[0])) return { status: 503 };
      return { status: data.result[0], retryAfter: Math.max(1, Math.min(Number(data.result[1]) || 900, 86400)) };
    } catch { return { status: 503 }; }
  };
}
