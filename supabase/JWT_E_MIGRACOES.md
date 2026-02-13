# Guia: Corrigir 401 (role "admin" does not exist)

Este guia cobre as duas partes necessárias para ultrapassar o erro: **1) JWT no Supabase** e **2) Migrações**.

---

## 1. JWT no Supabase (prioridade máxima)

O PostgREST usa o claim **`role`** do JWT como **role do PostgreSQL**. Se o token tiver `"role": "admin"` (cargo da app), o Postgres devolve `role "admin" does not exist` e a API responde 401.

**Objetivo:** Garantir que o JWT de utilizadores autenticados tenha sempre **`"role": "authenticated"`** e nunca `"admin"` ou `"user"`.

### Caso: definiste "admin" no Dashboard (Auth Users) e não tens Auth Hook

Se o erro começou **depois de definires role "admin" diretamente no Supabase** (em Authentication → Users e/ou na tabela `user_profiles`), é provável que tenhas alterado os **App Metadata** do utilizador. Em alguns fluxos, uma chave **`role`** em App Metadata pode ser refletida no claim **`role`** do JWT, o que provoca o 401.

**Solução:**

1. Abre o **Supabase Dashboard** → **Authentication** → **Users**.
2. Clica no utilizador que usa para fazer login (o que tem role admin).
3. Abre a secção **App Metadata** (e, se existir, **User Metadata**).
4. Se existir uma chave chamada **`role`** com valor `"admin"` (ou `"user"`, etc.):
   - **Remove essa chave** `role` dos App Metadata.  
   - O cargo da app (admin/user) deve ficar **só** na tabela **`public.user_profiles`** (coluna `role`). A app já lê esse valor via API; não deve estar no JWT como claim `role`.
5. Guarda e fecha.
6. Na app: faz **logout** e **login** de novo (para obter um token novo com `role: "authenticated"`).

**Alternativa (todos os utilizadores de uma vez):** podes usar o script `scripts/remove-role-from-app-metadata.js`. Define a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` (chave service role do projeto no Dashboard → Settings → API) e opcionalmente `PROJECT_URL` (default: `https://avexnivpijcvdoasfawq.supabase.co`). Depois executa: `node scripts/remove-role-from-app-metadata.js`.

Assim o JWT deixa de ter `role: "admin"` e o PostgREST volta a usar o role PostgreSQL `authenticated`. A rota para gerir funcionários continua a funcionar porque o código verifica o cargo em **`user_profiles.role`** (via `supabase.from('user_profiles').select('role')`), não no JWT.

### Passos no Dashboard (Hooks e outros)

1. Abre o **Supabase Dashboard**: https://supabase.com/dashboard  
2. Seleciona o teu projeto (no teu `config.toml` o `project_id` é `avexnivpijcvdoasfawq`).
3. No menu lateral: **Authentication** → **Hooks** (por vezes aparece como "Auth Hooks" ou "Hooks (Beta)").
4. Procura um hook do tipo **"Customize Access Token"** ou **"Custom Access Token"**.
5. Se **existir** esse hook:
   - Clica para ver detalhes (função Postgres ou URL configurada).
   - **Se a função/endpoint alterar o claim `role`** (por exemplo a partir de `user_profiles.role`):
     - **Opção A (recomendada):** Desativar ou remover este hook. O Supabase passa a emitir o JWT com `role: "authenticated"` por defeito.
     - **Opção B:** Alterar o hook para **nunca** escrever no claim `role`. Se precisares do cargo da app no token, usar **outro** claim (ex.: `app_role` ou `user_role`) e deixar `role` com o valor original que o Supabase envia (ex.: `event->'claims'->'role'` = `"authenticated"`).
   - Guarda e faz um novo login na app para obter um token novo.
6. Se **não existir** nenhum Custom Access Token hook:
   - Seguir a secção acima (remover `role` dos App Metadata do utilizador).
   - Se ainda vires `role: "admin"` no JWT após logout/login, pode haver configuração em **Project Settings → Auth**. Confirma que nenhuma opção está a definir o claim `role` para o cargo da app.

### Como verificar o JWT

- Na app: após login, podes decodificar o `access_token` em https://jwt.io e confirmar que o payload tem `"role": "authenticated"` e não `"role": "admin"`.
- Ou no browser (DevTools → Network): escolhe um request à API do Supabase e inspeciona o header `Authorization`; o token é a parte após `Bearer `.

---

## 2. Migrações (garantir que estão aplicadas)

As migrações **20260210000006** e **20260212000001** corrigem ambiguidade do `role` em funções RLS e alinham o modelo com mono-tenant. Precisam de estar aplicadas no **mesmo** projeto onde a app corre.

### 2.1 Verificar se o Supabase CLI está ligado ao projeto

No terminal, na pasta do projeto (onde está `supabase/config.toml`):

```bash
cd c:\Users\PC\Joel\rental\MoFleet
npx supabase link
```

Se ainda não estiver ligado, segue as instruções (project ref e password da DB se pedido). O `project_id` no `config.toml` deve coincidir com o projeto do Dashboard.

### 2.2 Ver que migrações já estão aplicadas

```bash
npx supabase migration list
```

- **Applied** = já aplicadas nesse projeto.
- As que aparecem como **pending** ainda não foram aplicadas.

### 2.3 Aplicar migrações em falta

Para aplicar todas as migrações pendentes ao projeto remoto:

```bash
npx supabase db push
```

Se usares apenas o Dashboard (sem CLI), podes aplicar o SQL manualmente:

1. Dashboard → **SQL Editor**.
2. Abre o ficheiro da migração no teu editor (por exemplo `supabase/migrations/20260210000006_fix_is_super_admin_role_ambiguity.sql` e depois `20260212000001_mono_tenant_remove_company_from_profiles.sql`).
3. Copia o conteúdo e executa no SQL Editor (por ordem: primeiro 20260210000006, depois 20260212000001).
4. Se alguma migração depender de migrações anteriores ainda não aplicadas, aplica primeiro as anteriores pela ordem do nome (data).

### 2.4 Migrações importantes para este erro

| Migração | O que faz |
|----------|-----------|
| `20260210000006_fix_is_super_admin_role_ambiguity.sql` | Corrige `is_super_admin()` para usar `user_profiles.role` (evita ambiguidade com o role do Postgres). |
| `20260212000001_mono_tenant_remove_company_from_profiles.sql` | Remove `company_id` de `user_profiles`, atualiza `handle_new_user`, define `is_admin()` e políticas de user_profiles. |

---

## Resumo

1. **JWT (sem Auth Hook):** Authentication → Users → editar o utilizador → **App Metadata** → remover a chave **`role`** se existir (para o JWT voltar a ter `role: "authenticated"`). O cargo da app fica só em `user_profiles.role`; a app já usa essa tabela para a rota de gerir funcionários.
2. **JWT (com Auth Hook):** Authentication → Hooks → remover ou corrigir o Custom Access Token para o claim `role` ser sempre `"authenticated"`.
3. **Migrações:** `npx supabase migration list` e depois `npx supabase db push` (ou executar o SQL das migrações pelo Dashboard, por ordem).

Depois: fazer **logout e login** na app e voltar a testar os pedidos que davam 401.
