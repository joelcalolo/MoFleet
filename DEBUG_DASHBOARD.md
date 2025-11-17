# Debug do Dashboard - Problema de Carregamento de Dados

## Problema Identificado

Ao fazer login com a conta recebida no email (owner), o dashboard não carrega os dados da empresa. Apenas mostra o nome do usuário e role, mas não há dados, nem logs de erro.

## Correções Implementadas

### 1. Logs de Debug Adicionados

**Arquivo**: `src/hooks/useCompany.ts`
- Logs detalhados em cada etapa do processo de busca do `companyId`
- Logs quando `user_profile` é encontrado ou não
- Logs de erros com detalhes completos

**Arquivo**: `src/pages/Dashboard.tsx`
- Logs quando `companyId` está disponível ou não
- Logs antes de buscar stats e reservations

### 2. Políticas RLS Corrigidas

**Migration**: `20250116000014_fix_user_profile_rls_and_is_active.sql`
- Garante que todos os `user_profiles` tenham `is_active = true`
- Política RLS atualizada para permitir leitura do próprio perfil mesmo se `is_active` for NULL (compatibilidade)
- Política permite: `user_id = auth.uid() AND (is_active = true OR is_active IS NULL)`

### 3. Mensagens de Erro Melhoradas

**Arquivo**: `src/pages/Dashboard.tsx`
- Mensagem clara quando `companyId` não está disponível
- Informações de debug incluídas na mensagem de erro
- Estado de loading separado para `companyLoading` e `loading` (stats)

## Como Diagnosticar

### Passo 1: Abrir o Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Faça login com a conta recebida no email
4. Observe os logs que começam com `useCompany:` e `Dashboard:`

### Passo 2: Verificar os Logs

Procure por estas mensagens na ordem:

1. **`useCompany: Starting to fetch company ID...`**
   - Indica que o hook começou a buscar o companyId

2. **`useCompany: Detected subdomain: ...`**
   - Mostra se um subdomain foi detectado da URL

3. **`useCompany: Checking auth user...`**
   - Indica que está verificando o usuário autenticado

4. **`useCompany: Auth user: { id: ..., email: ... }`**
   - Mostra se o usuário está autenticado

5. **`User profile found: { company_id: ..., is_active: ..., user_id: ... }`**
   - ✅ **SUCESSO**: Perfil encontrado com company_id
   - ❌ **ERRO**: Se não aparecer, o perfil não foi encontrado

6. **`Dashboard: useEffect triggered { companyId: ..., companyLoading: ... }`**
   - Mostra se o Dashboard recebeu o companyId

### Passo 3: Verificar Erros

Se aparecer algum destes erros:

#### Erro: "User profile not found for user: ..."
**Causa**: O `user_profile` não existe ou as políticas RLS estão bloqueando.

**Solução**:
1. Verificar no Supabase Dashboard se o `user_profile` existe:
   ```sql
   SELECT * FROM user_profiles WHERE user_id = 'SEU_USER_ID';
   ```

2. Verificar se `is_active = true`:
   ```sql
   UPDATE user_profiles 
   SET is_active = true 
   WHERE user_id = 'SEU_USER_ID';
   ```

3. Aplicar a migration `20250116000014_fix_user_profile_rls_and_is_active.sql`

#### Erro: "Error fetching user profile: ..."
**Causa**: Problema com políticas RLS ou conexão.

**Solução**:
1. Verificar as políticas RLS no Supabase Dashboard
2. Aplicar a migration `20250116000014_fix_user_profile_rls_and_is_active.sql`
3. Verificar se o usuário está autenticado corretamente

#### Erro: "Company ID not available"
**Causa**: O `companyId` não foi encontrado.

**Solução**:
1. Verificar se o `user_profile` tem `company_id` definido
2. Verificar se a empresa existe:
   ```sql
   SELECT * FROM companies WHERE id = 'COMPANY_ID_DO_USER_PROFILE';
   ```

## Próximos Passos

1. **Aplicar as migrations**:
   ```bash
   supabase db push
   ```
   Ou executar manualmente no Supabase Dashboard:
   - `20250116000013_fix_cars_rls_policies.sql`
   - `20250116000014_fix_user_profile_rls_and_is_active.sql`

2. **Testar novamente**:
   - Fazer login
   - Abrir o console do navegador
   - Verificar os logs
   - Verificar se os dados aparecem

3. **Se ainda não funcionar**:
   - Copiar todos os logs do console
   - Verificar no Supabase Dashboard se o `user_profile` existe e tem `is_active = true`
   - Verificar se o `company_id` está definido no `user_profile`

## Queries Úteis para Debug

```sql
-- Verificar user_profile do usuário atual
SELECT 
  up.*,
  c.name as company_name,
  c.subdomain
FROM user_profiles up
LEFT JOIN companies c ON c.id = up.company_id
WHERE up.user_id = auth.uid();

-- Verificar se is_active está definido
SELECT 
  user_id,
  company_id,
  role,
  is_active,
  CASE 
    WHEN is_active IS NULL THEN 'NULL - PROBLEMA!'
    WHEN is_active = false THEN 'FALSE - PROBLEMA!'
    ELSE 'OK'
  END as status
FROM user_profiles
WHERE user_id = auth.uid();

-- Atualizar is_active para todos os usuários
UPDATE user_profiles
SET is_active = true
WHERE is_active IS NULL OR is_active = false;
```

---

**Data**: 2025-01-16  
**Migrations**: 
- `20250116000013_fix_cars_rls_policies.sql`
- `20250116000014_fix_user_profile_rls_and_is_active.sql`

