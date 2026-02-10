import { supabase } from "@/integrations/supabase/client";

// Limita a quantidade de requisições Supabase em paralelo.
// Isso ajuda a evitar picos repentinos que podem contribuir para 429,
// especialmente em páginas que fazem muitas queries ao mesmo tempo.

const MAX_CONCURRENT_REQUESTS = 5;
let activeRequests = 0;
const queue: Array<() => void> = [];

function isRateLimitError(error: any): boolean {
  if (!error) return false;
  // Erros de auth costumam vir com esse código
  if (error.code === "over_request_rate_limit") return true;
  // Em alguns casos pode vir como status HTTP
  if (typeof error.status === "number" && error.status === 429) return true;
  return false;
}

function runNextFromQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) return;
  const next = queue.shift();
  if (!next) return;
  activeRequests++;
  next();
}

export async function withSupabaseLimit(operation: () => Promise<any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const execute = () => {
      operation()
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          if (isRateLimitError(error) && import.meta.env.DEV) {
            // Em produção evitamos logar em excesso
            // Mas em dev é útil ver quando o limite é atingido
            // eslint-disable-next-line no-console
            console.warn("[supabaseSafe] Rate limit atingido (429 / over_request_rate_limit)", error);
          }
          reject(error);
        })
        .finally(() => {
          activeRequests = Math.max(0, activeRequests - 1);
          runNextFromQueue();
        });
    };

    queue.push(execute);
    runNextFromQueue();
  });
}

// Re-export do client original para evitar imports misturados.
export { supabase };

