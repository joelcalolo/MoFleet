-- Migration: Remover Multi-Tenant e Simplificar para Sistema de Uma Única Empresa
-- Remove company_id de todas as tabelas, remove company_users, simplifica RLS

-- ============================================================================
-- FASE 1: Remover TODAS as Políticas RLS que dependem de company_id PRIMEIRO
-- ============================================================================
-- IMPORTANTE: Devemos remover as políticas ANTES de remover as colunas

-- ===== CARS =====
DROP POLICY IF EXISTS "Users can view cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can insert cars to their company" ON public.cars;
DROP POLICY IF EXISTS "Users can update cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can delete cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can update cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can delete cars" ON public.cars;

-- ===== CUSTOMERS =====
DROP POLICY IF EXISTS "Users can view customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers to their company" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- ===== RESERVATIONS =====
DROP POLICY IF EXISTS "Users can view reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert reservations to their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can update reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON public.reservations;

-- ===== CHECKOUTS =====
DROP POLICY IF EXISTS "Users can view checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can insert checkouts to their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can update checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can delete checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can view checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can insert checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can update checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can delete checkouts" ON public.checkouts;

-- ===== CHECKINS =====
DROP POLICY IF EXISTS "Users can view checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can insert checkins to their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can update checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can delete checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can view checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can insert checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can update checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can delete checkins" ON public.checkins;

-- ===== COMPANY_USERS =====
DROP POLICY IF EXISTS "Users can view company users from their company" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can create company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can update company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can delete company users" ON public.company_users;
DROP POLICY IF EXISTS "Super admins can view all company users" ON public.company_users;
DROP POLICY IF EXISTS "Super admins can manage all company users" ON public.company_users;
DROP POLICY IF EXISTS "Gerentes can view company users from their company" ON public.company_users;

-- ============================================================================
-- FASE 2: Remover Foreign Keys e Constraints
-- ============================================================================

-- Remover foreign keys de company_id
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_company_id_fkey;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_company_id_fkey;
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_company_id_fkey;
ALTER TABLE public.checkouts DROP CONSTRAINT IF EXISTS checkouts_company_id_fkey;
ALTER TABLE public.checkins DROP CONSTRAINT IF EXISTS checkins_company_id_fkey;
ALTER TABLE public.company_users DROP CONSTRAINT IF EXISTS company_users_company_id_fkey;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_company_id_fkey;

-- ============================================================================
-- FASE 3: Remover Colunas company_id
-- ============================================================================

ALTER TABLE public.cars DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.customers DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.reservations DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.checkouts DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.checkins DROP COLUMN IF EXISTS company_id;

-- ============================================================================
-- FASE 4: Remover Tabelas e Funções Relacionadas
-- ============================================================================

-- Remover tabela company_users completamente
DROP TABLE IF EXISTS public.company_users CASCADE;

-- Remover funções relacionadas a multi-tenant
DROP FUNCTION IF EXISTS public.authenticate_company_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_company_by_subdomain(TEXT);
DROP FUNCTION IF EXISTS public.can_manage_company_users(UUID);
DROP FUNCTION IF EXISTS public.can_gerente_manage_company_users(UUID, UUID);
DROP FUNCTION IF EXISTS public.gerente_create_company_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.gerente_update_company_user(UUID, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.gerente_delete_company_user(UUID);
DROP FUNCTION IF EXISTS public.user_has_company_access(UUID);

-- Remover trigger que cria company automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- FASE 5: Remover Índices Relacionados
-- ============================================================================

DROP INDEX IF EXISTS idx_companies_subdomain;
DROP INDEX IF EXISTS idx_company_users_company_id;
DROP INDEX IF EXISTS idx_company_users_username;

-- ============================================================================
-- FASE 6: Criar Novas Políticas RLS Simplificadas
-- ============================================================================

-- ===== CARS =====
CREATE POLICY "Authenticated users can view cars" ON public.cars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cars" ON public.cars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cars" ON public.cars FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cars" ON public.cars FOR DELETE TO authenticated USING (true);

-- ===== CUSTOMERS =====
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- ===== RESERVATIONS =====
CREATE POLICY "Authenticated users can view reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (true);

-- ===== CHECKOUTS =====
CREATE POLICY "Authenticated users can view checkouts" ON public.checkouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert checkouts" ON public.checkouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update checkouts" ON public.checkouts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete checkouts" ON public.checkouts FOR DELETE TO authenticated USING (true);

-- ===== CHECKINS =====
CREATE POLICY "Authenticated users can view checkins" ON public.checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert checkins" ON public.checkins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update checkins" ON public.checkins FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete checkins" ON public.checkins FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- FASE 7: Simplificar ou Remover Tabelas Companies e User Profiles
-- ============================================================================

-- Opção: Manter tabelas mas remover dependências
-- Se quiser remover completamente, descomente as linhas abaixo:
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;
-- DROP TABLE IF EXISTS public.companies CASCADE;

-- Por enquanto, vamos manter as tabelas mas remover políticas relacionadas a company_id
-- Isso permite que o sistema continue funcionando sem depender de company_id

DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can update all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can delete all companies" ON public.companies;

-- Simplificar políticas de companies (se ainda for usada)
CREATE POLICY "Authenticated users can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update companies" ON public.companies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);

-- Simplificar políticas de user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FASE 8: Remover Função is_super_admin se não for mais necessária
-- ============================================================================

-- Manter função is_super_admin caso ainda seja usada em outros lugares
-- Se não for mais necessária, descomente:
-- DROP FUNCTION IF EXISTS public.is_super_admin();

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON TABLE public.cars IS 'Tabela de carros - sistema de única empresa';
COMMENT ON TABLE public.customers IS 'Tabela de clientes - sistema de única empresa';
COMMENT ON TABLE public.reservations IS 'Tabela de reservas - sistema de única empresa';
