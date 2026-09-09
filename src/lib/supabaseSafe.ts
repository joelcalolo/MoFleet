import { supabase } from "@/integrations/supabase/client";

// Controla pico de requisições Supabase para evitar 429.
// Fase 0+1: reduz concorrência, adiciona throttle e retry com backoff só para 429.
// Nunca deve causar logout em 429 — isso é tratado no Layout.

const MAX_CONCURRENT_REQUESTS = 3;
const MIN_INTERVAL_MS = 120;
const MAX_RETRIES_ON_429 = 2;

let activeRequests = 0;
let lastRequestAt = 0;
const queue: Array<() => void> = [];

export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  if (error.code === "over_request_rate_limit") return true;
  if (typeof error.status === "number" && error.status === 429) return true;
  if (typeof error.statusCode === "number" && error.statusCode === 429) return true;
  const msg = String(error.message || "").toLowerCase();
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("over_request")) return true;
  if (error.error && isRateLimitError(error.error)) return true;
  return false;
}

export function isAuthError(error: any): boolean {
  if (!error) return false;
  if (error.status === 401 || error.statusCode === 401) return true;
  if (error.code === "PGRST301" || error.code === "401" || error.code === "22023") return true;
  const msg = String(error.message || "").toLowerCase();
  if (msg.includes("jwt") || msg.includes("not authenticated") || msg.includes("invalid token")) return true;
  if (error.error && isAuthError(error.error)) return true;
  return false;
}

function runNextFromQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) return;
  const next = queue.shift();
  if (!next) return;
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
  activeRequests++;
  lastRequestAt = now + wait;
  if (wait > 0) {
    setTimeout(next, wait);
  } else {
    next();
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withSupabaseLimit<T>(operation: () => Promise<T>): Promise<T> {
  const execWithRetry = (retryCount: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        operation()
          .then((result: any) => {
            const maybeError = result?.error;
            if (maybeError && isRateLimitError(maybeError) && retryCount < MAX_RETRIES_ON_429) {
              const backoff = 700 * Math.pow(2, retryCount) + Math.random() * 250;
              console.warn(`[supabaseSafe] 429 em result.error — retry ${retryCount + 1}/${MAX_RETRIES_ON_429} em ${Math.round(backoff)}ms`, maybeError);
              activeRequests = Math.max(0, activeRequests - 1);
              runNextFromQueue();
              sleep(backoff).then(() => execWithRetry(retryCount + 1).then(resolve).catch(reject));
              return;
            }
            if (maybeError && isRateLimitError(maybeError)) {
              console.warn("[supabaseSafe] Rate limit persistente após retries", maybeError);
            }
            activeRequests = Math.max(0, activeRequests - 1);
            runNextFromQueue();
            resolve(result);
          })
          .catch((error) => {
            if (isRateLimitError(error) && retryCount < MAX_RETRIES_ON_429) {
              const backoff = 700 * Math.pow(2, retryCount) + Math.random() * 250;
              console.warn(`[supabaseSafe] 429 (throw) — retry ${retryCount + 1}/${MAX_RETRIES_ON_429} em ${Math.round(backoff)}ms`, error);
              activeRequests = Math.max(0, activeRequests - 1);
              runNextFromQueue();
              sleep(backoff).then(() => execWithRetry(retryCount + 1).then(resolve).catch(reject));
              return;
            }
            if (isRateLimitError(error)) {
              console.warn("[supabaseSafe] Rate limit persistente (throw) após retries", error);
            }
            activeRequests = Math.max(0, activeRequests - 1);
            runNextFromQueue();
            reject(error);
          });
      };
      queue.push(run);
      runNextFromQueue();
    });

  return execWithRetry(0);
}

// Re-export do client original para evitar imports misturados.
export { supabase };
