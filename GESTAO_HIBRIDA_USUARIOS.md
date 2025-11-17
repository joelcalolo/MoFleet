# Gestão Híbrida de Usuários da Empresa

## 📋 Visão Geral

Implementada uma abordagem híbrida que permite que **Owners/Admins** (contas com email) e **Gerentes** (company_users) possam gerenciar usuários da empresa.

## 🎯 Estrutura de Permissões

### 1. **Owner/Admin** (user_profiles com email)
- **Role**: `owner` ou `admin` em `user_profiles`
- **Acesso**: Via subdomain com email/senha (Supabase Auth)
- **Permissões**: 
  - ✅ Pode criar/editar/deletar `company_users` da sua empresa
  - ✅ Gerencia configurações da empresa
  - ✅ Acesso completo aos dados da empresa

### 2. **Gerente** (company_users)
- **Role**: `gerente` em `company_users`
- **Acesso**: Via subdomain com username/senha (autenticação customizada)
- **Permissões**:
  - ✅ Pode criar/editar/deletar outros `company_users` da mesma empresa
  - ✅ Gerencia operações do dia a dia
  - ✅ **NÃO** pode deletar a si mesmo

### 3. **Super Admin** (sistema)
- **Role**: `super_admin` em `user_profiles`
- **Acesso**: Via dashboard principal
- **Permissões**:
  - ✅ Pode gerenciar `company_users` de **todas** as empresas
  - ✅ Acesso administrativo global

## 🔧 Implementação Técnica

### Migration: `20250116000012_enable_hybrid_user_management.sql`

#### Funções Auxiliares

1. **`can_manage_company_users(p_company_id UUID)`**
   - Verifica se o usuário autenticado (auth.uid()) pode gerenciar company_users
   - Retorna `true` para super_admin, owner e admin da empresa

2. **`can_gerente_manage_company_users(p_company_user_id UUID, p_target_company_id UUID)`**
   - Verifica se um gerente pode gerenciar outros company_users
   - Valida se o gerente está ativo, tem role 'gerente' e pertence à mesma empresa

#### Funções RPC para Gerentes

Como `company_users` não usam `auth.uid()`, foram criadas funções RPC que recebem o ID do gerente:

1. **`gerente_create_company_user(...)`**
   - Permite que um gerente crie novos company_users
   - Valida permissões antes de criar

2. **`gerente_update_company_user(...)`**
   - Permite que um gerente atualize company_users
   - Suporta atualização parcial (apenas campos fornecidos)

3. **`gerente_delete_company_user(...)`**
   - Permite que um gerente delete company_users
   - **Proteção**: Não permite que gerente delete a si mesmo

#### Políticas RLS

- **SELECT**: Owners/admins podem ver company_users da sua empresa; super_admins podem ver todos
- **INSERT**: Owners/admins podem criar company_users da sua empresa (via RLS)
- **UPDATE**: Owners/admins podem atualizar company_users da sua empresa (via RLS)
- **DELETE**: Owners/admins podem deletar company_users da sua empresa (via RLS)

**Nota**: Gerentes usam funções RPC (não RLS direto) porque não têm `auth.uid()`.

### Frontend: `src/pages/CompanyUsers.tsx`

O componente foi atualizado para:

1. **Detectar tipo de usuário**:
   - Verifica se é super_admin, owner/admin ou gerente
   - Define `canManageUsers` baseado nas permissões

2. **Operações diferentes por tipo**:
   - **Owner/Admin/Super Admin**: Usa operações diretas do Supabase (INSERT/UPDATE/DELETE)
   - **Gerente**: Usa funções RPC (`gerente_create_company_user`, etc.)

3. **Interface unificada**:
   - Mesma interface para todos os tipos de usuários
   - Seleção de empresa apenas para super_admin

## 📝 Fluxo de Uso

### Para Owner/Admin (conta com email):

1. Faz login no subdomain com email/senha
2. Acessa "Usuários da Empresa"
3. Pode criar/editar/deletar company_users diretamente
4. As políticas RLS garantem que só pode gerenciar usuários da sua empresa

### Para Gerente (company_user):

1. Faz login no subdomain com username/senha
2. Acessa "Usuários da Empresa"
3. Pode criar/editar/deletar outros company_users
4. As funções RPC validam permissões antes de executar

### Para Super Admin:

1. Faz login no dashboard principal
2. Acessa "Usuários da Empresa"
3. Seleciona a empresa desejada
4. Pode gerenciar company_users de qualquer empresa

## ✅ Vantagens da Abordagem

1. **Separação de Responsabilidades**:
   - Owner gerencia a empresa e configurações
   - Gerente gerencia operações e usuários operacionais

2. **Flexibilidade**:
   - Owner pode delegar gestão de usuários ao gerente
   - Múltiplos gerentes podem gerenciar usuários

3. **Segurança**:
   - Cada empresa gerencia apenas seus próprios usuários
   - Políticas RLS garantem isolamento entre empresas
   - Funções RPC validam permissões antes de executar

4. **Escalabilidade**:
   - Suporta múltiplos gerentes por empresa
   - Super admin pode intervir quando necessário

## 🔄 Próximos Passos

1. **Aplicar a migration**:
   ```bash
   supabase db push
   ```

2. **Testar**:
   - Criar um novo usuário (owner)
   - Verificar se pode gerenciar company_users
   - Fazer login como gerente
   - Verificar se pode criar/editar/deletar outros company_users

3. **Documentar para usuários**:
   - Explicar diferença entre owner e gerente
   - Guia de como delegar permissões

---

**Data**: 2025-01-16  
**Migration**: `20250116000012_enable_hybrid_user_management.sql`

