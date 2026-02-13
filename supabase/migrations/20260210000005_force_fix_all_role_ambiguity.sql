-- Migration FINAL para corrigir TODOS os problemas de ambiguidade do role
-- Esta migration força a remoção de TODAS as políticas e funções problemáticas
-- e garante que apenas políticas simples e corretas estejam ativas
--
-- PROBLEMA CRÍTICO: Ainda há políticas RLS ativas que usam `role IN ('owner', 'admin')` 
-- sem qualificar a coluna, causando o erro: role "admin" does not exist
--
-- SOLUÇÃO: Remover TODAS as políticas problemáticas e recriar apenas as corretas

-- ============================================================================
-- PARTE 1: Remover TODAS as políticas RLS que podem estar causando problemas
-- ============================================================================

-- Remover TODAS as políticas de cars que verificam company_id ou role
DROP POLICY IF EXISTS "Users can view cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can insert cars to their company" ON public.cars;
DROP POLICY IF EXISTS "Users can update cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can delete cars from their company" ON public.cars;

-- Remover TODAS as políticas de customers que verificam company_id ou role
DROP POLICY IF EXISTS "Users can view customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers to their company" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers from their company" ON public.customers;

-- Remover TODAS as políticas de reservations que verificam company_id ou role
DROP POLICY IF EXISTS "Users can view reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert reservations to their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can update reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete reservations from their company" ON public.reservations;

-- Remover TODAS as políticas de checkouts que verificam company_id ou role
DROP POLICY IF EXISTS "Users can view checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can insert checkouts to their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can update checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can delete checkouts from their company" ON public.checkouts;

-- Remover TODAS as políticas de checkins que verificam company_id ou role
DROP POLICY IF EXISTS "Users can view checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can insert checkins to their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can update checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can delete checkins from their company" ON public.checkins;

-- ============================================================================
-- PARTE 2: Garantir que políticas permissivas simples estejam ativas
-- ============================================================================

-- CARS - Políticas simples que permitem tudo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
CREATE POLICY "Authenticated users can view cars" ON public.cars FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert cars" ON public.cars;
CREATE POLICY "Authenticated users can insert cars" ON public.cars FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update cars" ON public.cars;
CREATE POLICY "Authenticated users can update cars" ON public.cars FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete cars" ON public.cars;
CREATE POLICY "Authenticated users can delete cars" ON public.cars FOR DELETE TO authenticated USING (true);

-- CUSTOMERS - Políticas simples que permitem tudo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- RESERVATIONS - Políticas simples que permitem tudo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
CREATE POLICY "Authenticated users can view reservations" ON public.reservations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON public.reservations;
CREATE POLICY "Authenticated users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update reservations" ON public.reservations;
CREATE POLICY "Authenticated users can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON public.reservations;
CREATE POLICY "Authenticated users can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (true);

-- CHECKOUTS - Políticas simples que permitem tudo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can view checkouts" ON public.checkouts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can insert checkouts" ON public.checkouts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can update checkouts" ON public.checkouts FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can delete checkouts" ON public.checkouts FOR DELETE TO authenticated USING (true);

-- CHECKINS - Políticas simples que permitem tudo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view checkins" ON public.checkins;
CREATE POLICY "Authenticated users can view checkins" ON public.checkins FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert checkins" ON public.checkins;
CREATE POLICY "Authenticated users can insert checkins" ON public.checkins FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update checkins" ON public.checkins;
CREATE POLICY "Authenticated users can update checkins" ON public.checkins FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete checkins" ON public.checkins;
CREATE POLICY "Authenticated users can delete checkins" ON public.checkins FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PARTE 3: Garantir que is_super_admin() está correta e não causa problemas
-- ============================================================================

-- Recriar função is_super_admin() com qualificação explícita
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  -- Desabilitar RLS temporariamente para evitar recursão
  SET LOCAL row_security = off;
  
  -- Bypass RLS usando SECURITY DEFINER
  -- CRÍTICO: Qualificar explicitamente a coluna role
  SELECT user_profiles.role, user_profiles.is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_profiles.user_id = auth.uid()
  LIMIT 1;
  
  -- Retornar true apenas se for super_admin E estiver ativo (ou NULL para compatibilidade)
  RETURN COALESCE(user_role = 'super_admin' AND (user_active = true OR user_active IS NULL), false);
END;
$$;

-- ============================================================================
-- PARTE 4: Garantir que user_profiles tenha políticas corretas
-- ============================================================================

-- Remover TODAS as políticas antigas de user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;

-- Criar políticas corretas para user_profiles
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- Usuários podem criar seu próprio perfil
CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Super admins podem ver todos os perfis (para gerenciar funcionários)
CREATE POLICY "Super admins can view all user profiles" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Super admins podem atualizar todos os perfis (para gerenciar funcionários)
CREATE POLICY "Super admins can update all user profiles" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- ============================================================================
-- PARTE 5: Remover funções problemáticas que ainda podem estar ativas
-- ============================================================================

-- Remover função can_manage_company_users se ainda existir (pode ter sido recriada)
DROP FUNCTION IF EXISTS public.can_manage_company_users(UUID);

-- Remover função user_has_company_access se ainda existir
DROP FUNCTION IF EXISTS public.user_has_company_access(UUID);

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON FUNCTION public.is_super_admin() IS 
'Verifica se o usuário autenticado é super_admin. Qualifica explicitamente user_profiles.role para evitar ambiguidade com roles do PostgreSQL.';

-- Verificar se há políticas problemáticas restantes (para debug)
-- Execute este SQL manualmente se necessário:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND (definition LIKE '%role%' AND definition NOT LIKE '%user_profiles.role%' AND definition NOT LIKE '%up.role%');
