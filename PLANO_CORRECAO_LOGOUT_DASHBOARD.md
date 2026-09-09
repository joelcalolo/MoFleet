# Plano de Correção — Logout Automático no Dashboard (Sr. Luís)

**Data:** 09/09/2026  
**Prioridade:** P1 — afeta 1 utilizador chave em produção  
**Sintoma:** Ao navegar para `/dashboard` dispara-se um pico de requisições → Supabase Auth retorna `429 over_request_rate_limit` → sessão é invalidada / token revogado → `supabase.auth.signOut()` força logout. Só reproduz no computador do Sr. Luís.

---

## 1. Diagnóstico Técnico (o que já sabemos pelo código)

### 1.1 Dashboard atual (`src/pages/Dashboard.tsx`)
No `useEffect` de mount dispara **sem deduplicação**:

| Momento | Requisições |
|---|---|
| `fetchStats()` imediato | `Promise.all` [ reservations, cars, customers, checkouts ] = **4** em paralelo |
| dentro de `fetchStats` | `checkins` filtrados por `reservation_ids` = **+1** condicional |
| `fetchReservations()` após 250ms | `reservations + joins` + `checkins` = **+2** |
| `fetchUpcomingReturns()` após 500ms | `checkouts + reservations` + `checkins` = **+2** |
| **Total no mount** | **8 a 9 requests Supabase** em < 1s |

`withSupabaseLimit` (`src/lib/supabaseSafe.ts`) limita para 5 concorrentes, mas apenas **enfileira**; não reduz o total nem faz debounce. Em `DEV` só loga o 429, em prod rejeita direto.

### 1.2 Layout (`src/components/Layout.tsx`) — agravante principal
Três `useEffect` independentes no mesmo mount:

1. `getSession()` + `onAuthStateChange()` — dependência `[navigate, location.pathname]` → **re-subscreve a cada navegação** (fuga de subscriptions se cleanup falhar).
2. `companies` fetch (`maybeSingle`) — 1 req.
3. `checkSuperAdmin` — `getSession()` + `user_profiles` + em caso de `401/PGRST301` faz `refreshSession()` + **retry** + **`signOut()`** em caso de 2º erro.

> **Causa direta do logout:** `checkSuperAdmin` faz `signOut()` para *qualquer* erro no 2º `select` (incluindo `429`). 429 não é falha de autenticação, é rate limit. O código atual não distingue `429` de `401` e revoga sessão indevidamente.

Somando Layout (3-4 reqs) + Dashboard (9 reqs) = **~12-13 reqs auth+PostgREST em ~500ms** só ao entrar no Dashboard.

### 1.3 Porque só no Sr. Luís?
Hipótese não é "código diferente", é **amplificação local**. Check-list ordenado por probabilidade:

1. **Múltiplas tabs/janelas** do MoFleet abertas → cada tab com `autoRefreshToken:true` compete pelo refresh → `429` no endpoint `auth/v1/token?grant_type=refresh_token`.
2. **Extensão / antivírus / proxy corporativo** (ex.: Kaspersky, Avast, AdGuard, tradutor automático) que duplica `fetch` ou faz prefetch.
3. **Cache / Service Worker antigo** (`public/sw.js`) — se o browser ficou com `CACHE_NAME='rentacar-v1'` desatualizado, pode estar a servir JS antigo com bug de loop (já foi corrigido o stagger 250/500ms, mas o cache pode manter versão anterior sem stagger).
4. **Relógio do sistema dessincronizado** → JWT parece expirado no client → `autoRefreshToken` entra em loop de refresh → 429 → `signOut()`.
5. **Rede com NAT/CGNAT partilhado** — o Rate Limit do Supabase é por IP. Se o IP do Sr. Luís tem mais utilizadores atrás do mesmo IP público, o limite é atingido mais rápido.
6. **Duplo mount em dev / StrictMode + HMR** — irrelevante em prod, mas se ele usa `vite dev` local, dobra as reqs.
7. **Cliques repetidos / F5 ansioso** durante loading (UX) — cada F5 reinicia os 12 reqs.

> Nenhuma destas causas aparece nos outros computadores porque nenhuma tem o mesmo IP/extensões/tabs/relógio.

---

## 2. Princípio de Correção

**Nunca fazer logout em `429`.** 429 é transitório e deve ter retry com backoff + UI degradada. Logout só para `401` confirmado após refresh falhado.

**Reduzir de 12 reqs → 2-3 reqs** no mount do Dashboard, com cache e deduplicação.

---

## 3. Plano em 4 Fases

### FASE 0 — Mitigação imediata (0-2h, sem deploy se possível)

**Objetivo:** parar o logout hoje mesmo para o Sr. Luís.

- [ ] **Hotfix `Layout.tsx`:** não fazer `signOut()` em `429`.
  ```ts
  const isRateLimit = err?.status === 429 || err?.code === 'over_request_rate_limit';
  if (isRateLimit) {
    console.warn('[auth] rate limited, retry sem logout');
    return; // mostrar toast "A sincronizar... tente em 30s" e sair
  }
  ```
  Só fazer `signOut()` se `status===401` **e** `refreshSession()` falhar.
- [ ] **Guia temporário para o Sr. Luís (enviar já):**
  1. Fechar todas as tabs do MoFleet, deixar só 1.
  2. `Ctrl+Shift+Del` → limpar cache da última hora.
  3. Desativar extensões (ad-blocker, tradutor).
  4. Verificar relógio: Windows → Definições → Hora → Sincronizar agora.
  5. Aceder em janela anónima (`Ctrl+Shift+N`) e testar Dashboard.
  6. Se persistir, gravar `F12 → Network → filtrar supabase` + `Console` e enviar HAR.

### FASE 1 — Hardening Frontend (1-2 dias) — ELIMINA O PICO

#### 1.1 Consolidar Dashboard em 1-2 queries
Criar RPC/View no Supabase ou agregar client-side com cache:

- Opção A (recomendada): `supabase.rpc('get_dashboard_stats')` que retorna `activeReservations, availableCars, totalCars, totalRevenue, upcomingReturns, totalCustomers, completed, cancelled, carsOut` numa única chamada SQL. Reduz 5 reqs → 1.
- Opção B: usar `react-query` (já instalado `@tanstack/react-query` mas não usado no Dashboard). Envolver cada fetch com:
  ```ts
  const q = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, gcTime: 5*60_000, retry: (c, e) => e.status!==429 && c<2, refetchOnWindowFocus:false } }
  });
  ```
  `staleTime: 60s` evita refetch ao voltar ao Dashboard dentro de 1 min.

#### 1.2 `src/lib/supabaseSafe.ts` — transformar em rate-limiter real
```ts
const MAX_CONCURRENT = 3; // de 5 → 3
const MIN_INTERVAL_MS = 120; // throttle global
// queue com p-queue + retry exponencial só para 429:
// 429 → await 800ms * 2^attempt + jitter → retry max 2x
// 401 → rejeita direto, sem retry (delega para auth layer)
// isRateLimit → throw custom RateLimitError para UI não fazer logout
```

#### 1.3 `Layout.tsx`
- Remover `location.pathname` da dependência do `onAuthStateChange` effect → subscrever **uma vez** no mount (`[]`).
- Armazenar `subscription` em `useRef` e garantir `unsubscribe` no unmount.
- `checkSuperAdmin`: separar concerns, memoizar, e **não** chamar `getSession()` se `session` já estiver em `user`. Usar `supabase.auth.getUser()` com cache 30s via react-query.
- Trocar `maybeSingle` sem `limit(1)` por `select('...').eq('user_id', user.id).single()` com `staleTime`.

#### 1.4 `Dashboard.tsx`
- Unificar `fetchStats`+`fetchReservations`+`fetchUpcomingReturns` em **um** `useQuery(['dashboard', user.id], fetcher, { staleTime: 30_000 })`.
- Usar `AbortController` + flag `cancelled` para cancelar reqs se o utilizador navegar antes de completar.
- Remover `setTimeout` stagger manual (era workaround); com queue + react-query já está controlado.
- Adicionar UI de "rate limited" (Alert amarelo) em vez de loader infinito.

### FASE 2 — Backend / Supabase (2-3 dias, em paralelo)

- [ ] Revisar **Rate Limits no Supabase Dashboard → Auth → Rate Limits**: aumentar de `Free tier` (~5/h/IP) se o plano permitir, ou pedir exceção para IP da empresa do Sr. Luís.
- [ ] Criar **View materializada** ou `rpc/get_dashboard_stats` com `SECURITY DEFINER` e `RLS` verificada, para evitar 6 round-trips.
- [ ] Ativar **Supabase API Gateway → observability**: logar `429` por `x-client-info` e por IP, para confirmar origem do pico.
- [ ] Considerar **Edge Function `dashboard-batch`** que agrega reservas+cars+customers+checkouts em uma resposta JSON (1 HTTP request).
- [ ] Definir **retry headers**: garantir que `Retry-After` do Supabase é respeitado pelo client.

### FASE 3 — Instrumentação & Prevenção de Regressão (1 dia)

- [ ] **Sentry / Log** (já existe `src/lib/errorHandler.ts`): enviar `429` com contexto `{ page: 'Dashboard', count, user_id, ip }` para alertar antes do logout.
- [ ] **Telemetry client**: contador `supabase_requests_per_page_load` (usar `performance.mark`).
- [ ] **Feature flag** `dashboard_v2` para rollout gradual.
- [ ] Testes: `playwright` E2E que abre Dashboard 10x em loop e assert `requests <= 4` e `nunca chama signOut`.
- [ ] **Guia de suporte** publicado: "Viu logout automático? Faça isto" (para futuros clientes).

---

## 4. Checklist de Diagnóstico no Computador do Sr. Luís

Executar numa call de 15 min com partilha de ecrã:

1. `chrome://extensions` → desativar todas → testar.
2. `F12 → Application → Local Storage` → `supabase.auth.token` → copiar `expires_at` → verificar se está no futuro e se `Date.now()` do PC bate com `https://worldtimeapi.org/api/ip`.
3. Abrir `chrome://serviceworker-internals` → `Unregister` para `rentacar-v1` → reload.
4. `F12 → Network → Disable cache` + `Preserve log` → navegar Dashboard → filtrar `supabase.co` → **contar requests** (deve ser ≤4 após fix, hoje ~13). Exportar HAR.
5. Verificar se há **2+ tabs** com MoFleet ou PWA instalada (ícone na barra).
6. Testar em **Firefox/Edge limpo** sem extensões — se não reproduzir, prova que é extensão/cache local.

---

## 5. Critérios de Aceite (DoD)

- [ ] Dashboard mount faz **≤3** requests Supabase (vs 12 hoje).
- [ ] `429` **nunca** dispara `signOut()`; mostra toast "Muitas requisições, a tentar novamente em Xs" com retry automático.
- [ ] Navegar Dashboard ↔ outra página 20x não aumenta contador de requests (cache react-query).
- [ ] Layout subscreve `onAuthStateChange` **uma vez** por sessão.
- [ ] HAR do Sr. Luís após fix mostra 0 logouts em 5 min de uso.
- [ ] Supabase Dashboard não mostra `over_request_rate_limit` para o IP do cliente nas 24h após deploy.

---

## 6. Estimativa

| Fase | Esforço | Risco |
|---|---|---|
| 0 Hotfix logout 429 | 2h, 1 dev | Baixo |
| 1 Frontend hardening | 1-2 dias | Médio |
| 2 Backend RPC/view | 1 dia | Baixo |
| 3 Instrumentação + testes | 1 dia | Baixo |

**Recomendação:** entregar Fase 0 **hoje** como patch, e Fase 1+2 no próximo release.

---

## 7. Ficheiros a tocar

- `src/lib/supabaseSafe.ts` — queue + retry + distinção 429/401
- `src/components/Layout.tsx` — fix subscriptions + checkSuperAdmin
- `src/pages/Dashboard.tsx` — migrar para react-query + RPC agregado
- `src/App.tsx` — configurar `QueryClient` com `staleTime` global
- `supabase/migrations/*_dashboard_stats.sql` — nova RPC
- `src/lib/errorHandler.ts` — mapear `over_request_rate_limit` para mensagem não-destrutiva

---

## 8. Próximo Passo Imediato

1. Aprovar este plano.
2. Aplicar **Fase 0** e enviar instruções ao Sr. Luís.
3. Agendar call de diagnóstico (15 min) para colher HAR/Network log antes do fix completo.

