type Bucket = number[];

const stores = new Map<string, Map<string, Bucket>>();

function storeFor(namespace: string): Map<string, Bucket> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map<string, Bucket>();
    stores.set(namespace, store);
  }
  return store;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(
  namespace: string,
  identifier: string,
  options: { max: number; windowMs: number },
): RateLimitResult {
  const { max, windowMs } = options;
  const now = Date.now();
  const store = storeFor(namespace);
  const key = identifier || "anonymous";
  const bucket = store.get(key) ?? [];
  const fresh = bucket.filter((ts) => now - ts < windowMs);

  if (fresh.length >= max) {
    const oldest = Math.min(...fresh);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000),
    );
    store.set(key, fresh);
    return { ok: false, retryAfterSec };
  }

  fresh.push(now);
  store.set(key, fresh);
  return { ok: true };
}

export function retryAfterMessage(retryAfterSec: number): string {
  const minutes = Math.ceil(retryAfterSec / 60);
  if (minutes <= 1) return "Coba lagi dalam 1 menit.";
  return `Coba lagi dalam ${minutes} menit.`;
}
