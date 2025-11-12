# Documentação Técnica - MoFleet

## Arquitetura Geral

### Stack Tecnológico

**Frontend:**
- React 18.3 + TypeScript
- Vite (build tool)
- React Router DOM (roteamento)
- TanStack Query (gerenciamento de estado servidor)
- Tailwind CSS + Shadcn UI (UI components)
- date-fns (manipulação de datas)

**Backend:**
- Supabase (BaaS)
  - PostgreSQL (banco de dados)
  - Row Level Security (RLS)
  - Auth (autenticação)
  - Storage (futuro)

**Infraestrutura:**
- PWA (Progressive Web App)
- Service Worker para cache offline

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Shadcn)
│   ├── cars/           # Componentes de carros
│   ├── customers/      # Componentes de clientes
│   ├── reservations/   # Componentes de reservas
│   └── fleet/          # Componentes de frota
├── pages/              # Páginas/rotas
├── hooks/              # Custom hooks
│   └── useCompany.ts   # Hook para company_id
├── lib/                # Utilitários
│   ├── dateUtils.ts    # Funções de data/timezone
│   ├── errorHandler.ts # Tratamento de erros
│   └── utils.ts        # Funções auxiliares
└── integrations/       # Integrações externas
    └── supabase/       # Cliente Supabase
```

## Arquitetura de Dados

### Modelo Multi-Tenant

Sistema multi-empresas com isolamento de dados via `company_id`:

- **companies**: Empresas do sistema
- **user_profiles**: Perfis de usuários (vinculados a company)
- **cars**: Veículos (filtrados por company_id)
- **customers**: Clientes (filtrados por company_id)
- **reservations**: Reservas (filtradas por company_id)
- **checkouts**: Saídas de veículos
- **checkins**: Retornos de veículos

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem:
- Usuários só acessam dados da sua empresa
- Isolamento completo entre empresas
- Validação automática via `company_id`

## Autenticação

**Fluxo:**
1. Supabase Auth gerencia autenticação
2. Após login, `user_profiles` fornece `company_id`
3. Hook `useCompany` disponibiliza `company_id` globalmente
4. Todas as queries filtram automaticamente por `company_id`

**Segurança:**
- Senhas criptografadas (Supabase)
- Tokens JWT para sessões
- RLS garante isolamento de dados
- Email confirmation obrigatório

## Padrões de Código

### Componentes
- Functional Components com Hooks
- TypeScript para type safety
- Props tipadas com interfaces

### Estado
- `useState` para estado local
- `useEffect` para side effects
- TanStack Query para dados do servidor
- Context API (futuro) para estado global

### Roteamento
- React Router DOM
- Rotas protegidas via `Layout.tsx`
- Redirecionamento automático para `/auth` se não autenticado

### Tratamento de Erros
- Centralizado em `lib/errorHandler.ts`
- Mensagens em português
- Logging de erros no console
- Toast notifications para feedback

## Fluxo de Dados

```
User Action → Component → Supabase Client → PostgreSQL
                ↓
         TanStack Query Cache
                ↓
         Component Update
```

## Timezone

Sistema configurado para **Angola (Africa/Luanda)**:
- Funções em `lib/dateUtils.ts`
- Formatação consistente de datas
- Cálculos consideram timezone local

## Build e Deploy

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
```

**Output:**
- `dist/` contém assets otimizados
- PWA ready (manifest.json + service worker)
- Static files para CDN/hosting

## Migrations

Migrations em `supabase/migrations/`:
- Versionadas por timestamp
- Aplicadas via Supabase CLI
- Incluem RLS policies e triggers

## Performance

- Code splitting automático (Vite)
- Lazy loading de rotas (futuro)
- Service Worker para cache
- Otimização de imagens (futuro)

## Segurança

- RLS em todas as tabelas
- Validação de inputs (Zod)
- Sanitização de dados
- HTTPS obrigatório (Supabase)
- CORS configurado

