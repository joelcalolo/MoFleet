# Deploy do MoFleet no Render

Este guia descreve como publicar o MoFleet (Vite + React) como **Static Site** no [Render](https://render.com).

## Pré-requisitos

- Conta no [Render](https://render.com)
- Repositório Git (GitHub ou GitLab) com o código do MoFleet
- URL e chave pública do Supabase (já usados em desenvolvimento)

## Opção A: Deploy com Blueprint (render.yaml)

O projeto inclui um ficheiro `render.yaml` na raiz. O Render usa-o para criar o serviço automaticamente.

1. **Ligar o repositório ao Render**
   - Em [dashboard.render.com](https://dashboard.render.com), **New** → **Blueprint**.
   - Conecta o GitHub/GitLab e escolhe o repositório do MoFleet.
   - O Render deteta o `render.yaml` e mostra o serviço **mofleet** (Static Site).

2. **Configurar variáveis de ambiente**
   - No serviço **mofleet**, abre **Environment**.
   - Adiciona:
     - `VITE_SUPABASE_URL` = URL do teu projeto Supabase (ex.: `https://xxxx.supabase.co`)
     - `VITE_SUPABASE_PUBLISHABLE_KEY` = chave pública (anon key) do Supabase
   - Guarda. O Render faz um novo deploy com estas variáveis.

3. **Deploy**
   - Clica **Apply** no Blueprint (ou faz push para o branch ligado).
   - O build usa `npm install && npm run build` e publica a pasta `dist`.
   - O site fica disponível em `https://mofleet.onrender.com` (ou no domínio que definires).

## Opção B: Deploy manual (sem Blueprint)

1. **New** → **Static Site**.
2. **Connect** o repositório do MoFleet.
3. **Configuração:**
   - **Name:** mofleet (ou outro nome).
   - **Branch:** `main` (ou o branch que usas).
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **Environment:** adiciona `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (valores do Supabase).
5. **Redirects/Rewrites** (importante para SPA):
   - **Redirects** → **Add Rule**
   - **Type:** Rewrite
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - Isto faz com que todas as rotas (ex.: `/dashboard`, `/auth`) devolvam `index.html` e o React Router funcione.
6. **Create Static Site**. O primeiro deploy é feito automaticamente.

## Domínio próprio

- No serviço, **Settings** → **Custom Domains**.
- Adiciona o domínio (ex.: `www.mofleet.online`).
- Configura no teu DNS o registo CNAME apontando para o URL que o Render indicar (ex.: `mofleet.onrender.com`).

## Notas

- **Variáveis VITE_**: só ficam disponíveis em build time. Qualquer alteração a `VITE_SUPABASE_*` exige um novo deploy.
- O `render.yaml` já define a rewrite `/*` → `/index.html` para o SPA; em deploy manual tens de adicionar esta regra no Dashboard.
- Service Worker (PWA): o `public/sw.js` é copiado para `dist` no build; o site continua a funcionar como PWA no Render.
