// remove-role-from-app-metadata.js
// Remove a chave "role" de app_metadata de todos os utilizadores (evita JWT com role "admin" → 401).
// Node 18+ (fetch disponível).
//
// Uso:
//   Coloca SUPABASE_SERVICE_ROLE_KEY no .env ou na consola (obrigatório: chave SERVICE ROLE, não anon).
//   PROJECT_URL opcional; default conforme supabase/config.toml.
//   node scripts/remove-role-from-app-metadata.js

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Carregar .env da raiz do projeto (sem dependência dotenv)
function loadEnv() {
  const root = resolve(process.cwd(), '.env');
  if (!existsSync(root)) return;
  const content = readFileSync(root, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
loadEnv();

const PROJECT_REF = 'avexnivpijcvdoasfawq'; // supabase/config.toml project_id
const PROJECT_URL = (process.env.PROJECT_URL || `https://${PROJECT_REF}.supabase.co`).trim();
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or: $env:SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const USERS_ENDPOINT = `${PROJECT_URL.replace(/\/$/, '')}/auth/v1/admin/users`;
const PAGE_SIZE = 100;

async function fetchUsers(pageToken = null) {
  const url = new URL(USERS_ENDPOINT);
  url.searchParams.set('per_page', String(PAGE_SIZE));
  if (pageToken) url.searchParams.set('page', pageToken);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list users: ${res.status} ${res.statusText} - ${text}`);
  }
  const data = await res.json();
  // API pode devolver array ou { users: [] }
  return Array.isArray(data) ? data : (data.users || []);
}

async function patchUserRemoveRole(userId, newAppMetadata) {
  const url = `${USERS_ENDPOINT}/${encodeURIComponent(userId)}`;
  const body = { app_metadata: newAppMetadata };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to patch user ${userId}: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

function withoutRole(app_metadata) {
  if (!app_metadata || typeof app_metadata !== 'object') return {};
  const { role, ...rest } = app_metadata;
  return rest;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log('Removing app_metadata.role for all users...');
  let page = 1;
  let totalProcessed = 0;

  while (true) {
    console.log(`Fetching page ${page} (per_page=${PAGE_SIZE})...`);
    let users;
    try {
      users = await fetchUsers(String(page));
    } catch (err) {
      console.error('Error fetching users:', err.message);
      if (err.cause) console.error('Cause:', err.cause);
      if (err.message.includes('401')) {
        console.error('\nDica: Usa a chave SERVICE ROLE (secret), não a anon. Dashboard → Settings → API → service_role (Reveal).');
        console.error('A chave e o PROJECT_URL têm de ser do mesmo projeto.');
      }
      process.exit(1);
    }

    if (!Array.isArray(users) || users.length === 0) {
      console.log('No more users to process.');
      break;
    }

    for (const user of users) {
      const userId = user.id;
      const app_metadata = user.app_metadata || {};
      if (Object.prototype.hasOwnProperty.call(app_metadata, 'role')) {
        const newAppMetadata = withoutRole(app_metadata);
        console.log(`User ${userId} (${user.email || 'no email'}) has role="${app_metadata.role}". Removing...`);
        let updated = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await patchUserRemoveRole(userId, newAppMetadata);
            console.log(`  ✓ Removed role for user ${userId}`);
            totalProcessed++;
            updated = true;
            break;
          } catch (err) {
            console.warn(`  Attempt ${attempt} failed: ${err.message}`);
            if (err.cause) console.warn('  Cause:', err.cause);
            if (attempt < 3) await sleep(500 * attempt);
            else console.error(`  ✗ Failed after 3 attempts.`);
          }
        }
        await sleep(100);
      }
    }

    if (users.length < PAGE_SIZE) break;
    page++;
    await sleep(200);
  }

  console.log(`Done. Removed app_metadata.role from ${totalProcessed} user(s).`);
})();
