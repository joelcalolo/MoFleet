# Guia de Multi-Tenancy - MoFleet

Este guia explica como configurar e usar o sistema multi-tenant do MoFleet, permitindo que cada empresa tenha seus próprios dados isolados.

## 📋 Visão Geral

O sistema MoFleet agora suporta multi-tenancy, o que significa:
- Cada empresa tem seus próprios dados (carros, clientes, reservas, etc.)
- Dados são isolados por `company_id` no banco de dados
- Suporte a subdomínios (ex: `empresa1.mofleet.com`)
- Dois tipos de usuários:
  - **Gestores**: Usuários Supabase Auth com email/senha (owners, admins)
  - **Usuários da Empresa**: Usuários locais com username/senha (gerentes, técnicos)

## 🚀 Como Aplicar a Migração

### Passo 1: Aplicar a migração no Supabase

```bash
# Via CLI do Supabase
npx supabase db push

# Ou via painel do Supabase
# Vá em SQL Editor e execute o arquivo:
# supabase/migrations/20260704000000_restore_multi_tenant.sql
```

### Passo 2: Verificar a migração

Após aplicar a migração, verifique se:
- A tabela `company_users` foi criada
- As colunas `company_id` foram adicionadas às tabelas principais
- As políticas RLS multi-tenant foram aplicadas

## 👥 Tipos de Usuários

### 1. Gestores (Supabase Auth)

**Acesso:** Email + Senha  
**Roles:** `owner`, `admin`, `user`  
**Criação:** Via signup na página `/auth`  
**Permissões:**
- `owner`: Acesso total à empresa
- `admin`: Pode gerenciar usuários da empresa
- `user`: Acesso limitado

### 2. Usuários da Empresa (Local)

**Acesso:** Código da Empresa + Username + Senha  
**Roles:** `gerente`, `tecnico`  
**Criação:** Criado por gestores via painel de administração  
**Permissões:**
- `gerente`: Pode gerenciar operações diárias
- `tecnico`: Acesso limitado a operações técnicas

## 🌐 Configuração de Subdomínios

### Opção 1: Subdomínios Automáticos (Recomendado)

Quando uma nova empresa é criada via signup, o sistema gera automaticamente um subdomínio baseado no nome da empresa:
- Nome: "RentCar Angola" → Subdomain: `rentcar-angola`
- URL: `https://rentcar-angola.mofleet.com`

### Opção 2: Configuração Manual DNS

Para usar subdomínios personalizados, configure:

1. **No Vercel:**
   - Adicionar domínio: `*.mofleet.com`
   - Obter registros DNS

2. **No provedor de DNS (GoDaddy, etc.):**
   - Tipo: CNAME
   - Nome: `*`
   - Valor: `cname.vercel-dns.com`

Veja o guia completo em: `CONFIGURACAO_SUBDOMINIOS.md`

## 🔐 Fluxo de Autenticação

### Login como Gestor

1. Acesse: `https://mofleet.com/auth` ou `https://sua-empresa.mofleet.com/auth`
2. Clique em "Entrar como Gestor"
3. Digite email e senha
4. Sistema detecta automaticamente a empresa via subdomínio ou user profile

### Login como Usuário da Empresa

1. Acesse: `https://sua-empresa.mofleet.com/auth`
2. O campo "Código da Empresa" é preenchido automaticamente com o subdomínio
3. Digite username e senha
4. Sistema autentica via função `authenticate_company_user`

## 📊 Estrutura de Dados

### Tabelas com Multi-Tenancy

Todas as tabelas principais agora têm `company_id`:
- `cars`
- `customers`
- `reservations`
- `checkouts`
- `checkins`

### Tabelas de Multi-Tenancy

- `companies`: Informações das empresas
- `user_profiles`: Perfil de usuários Supabase Auth
- `company_users`: Usuários locais da empresa

## 🔧 Uso no Frontend

### Hook useCompany

```typescript
import { useCompany } from "@/hooks/useCompany";

function MyComponent() {
  const { companyId, subdomain, loading } = useCompany();
  
  if (loading) return <div>Carregando...</div>;
  
  // Filtrar dados por company_id
  const { data } = await supabase
    .from('cars')
    .select('*')
    .eq('company_id', companyId);
}
```

### Exemplo em Páginas

```typescript
// Cars.tsx
const { companyId, loading: companyLoading } = useCompany();

useEffect(() => {
  if (!companyLoading && companyId) {
    fetchCars();
  }
}, [companyId, companyLoading]);

const fetchCars = async () => {
  if (!companyId) return;
  
  const { data } = await supabase
    .from("cars")
    .select("*")
    .eq("company_id", companyId);
};
```

## 🧪 Testes

### Teste 1: Criar Nova Empresa

1. Acesse `/auth`
2. Clique em "Criar Conta"
3. Preencha nome da empresa: "Teste Ltda"
4. Preencha email e senha
5. Após confirmação, verifique se a empresa foi criada com subdomain `teste-ltda`

### Teste 2: Login com Subdomínio

1. Configure DNS para subdomínios (ou use localhost)
2. Acesse `http://teste-ltda.localhost:3000/auth`
3. Verifique se o campo "Código da Empresa" está preenchido
4. Faça login como gestor

### Teste 3: Criar Usuário da Empresa

1. Faça login como owner/admin
2. Vá para página de usuários
3. Crie novo usuário da empresa com username e senha
4. Faça logout e login como esse usuário

## ⚠️ Considerações Importantes

### Segurança

- **RLS Policies:** Todas as tabelas têm políticas RLS que filtram por `company_id`
- **Isolamento:** Dados de uma empresa nunca são acessíveis por outra
- **Autenticação:** Senhas de usuários da empresa devem ser hashadas no cliente (implementação futura)

### Performance

- **Índices:** Índices criados em `company_id` para melhor performance
- **Subdomain Lookup:** Função `get_company_by_subdomain` otimizada

### Migração de Dados Existentes

A migração cria automaticamente uma empresa "Empresa Principal" e atribui todos os dados existentes a ela. Você pode:
1. Manter como empresa única
2. Criar novas empresas e mover dados manualmente
3. Deletar a empresa principal após configurar novas empresas

## 📝 Próximos Passos

### Implementações Futuras

1. **Hash de Senha no Cliente:** Implementar bcrypt/argon2 para senhas de company_users
2. **Página de Gestão de Company Users:** Interface para criar/gerenciar usuários da empresa
3. **Dashboard Multi-Tenant:** Visão geral para super admins verem todas as empresas
4. **API para Criar Empresas:** Endpoint para criar empresas programaticamente
5. **Sessão Company User:** Melhor gerenciamento de sessão para usuários da empresa

## 🆘 Troubleshooting

### Problema: Dados não aparecem após migração

**Solução:** Verifique se o `company_id` foi backfill corretamente:
```sql
SELECT * FROM cars WHERE company_id IS NULL;
```

### Problema: Subdomínio não é detectado

**Solução:** Em localhost, subdomínios não funcionam. Use:
- `http://localhost:3000` (sem subdomínio)
- Configure `/etc/hosts` para testes locais

### Problema: Login de company user falha

**Solução:** Verifique:
1. Se o subdomain está correto na tabela `companies`
2. Se o username existe em `company_users`
3. Se o usuário está ativo (`is_active = true`)

## 📞 Suporte

Para mais informações, consulte:
- `CONFIGURACAO_SUBDOMINIOS.md` - Configuração de DNS
- `DOCUMENTACAO_SISTEMA.md` - Documentação geral
- `DOCUMENTACAO_TECNICA.md` - Detalhes técnicos

---

**Última atualização:** Julho 2026
