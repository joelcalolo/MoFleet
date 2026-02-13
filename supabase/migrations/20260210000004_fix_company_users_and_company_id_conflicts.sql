-- Corrigir conflitos entre company_users (removido) e user_profiles
-- Remover referências a company_users e garantir que políticas funcionem sem company_id
--
-- PROBLEMAS IDENTIFICADOS:
-- 1. Função user_has_company_access referencia company_users que foi removido
-- 2. Políticas RLS verificam company_id que pode não existir mais
-- 3. Função is_super_admin() pode falhar se user_profiles não tiver company_id
-- 4. Políticas antigas baseadas em company_id estão bloqueando acesso

-- ============================================================================
-- PARTE 1: Remover/Corrigir funções que referenciam company_users
-- ============================================================================

-- Remover função user_has_company_access que referencia company_users
DROP FUNCTION IF EXISTS public.user_has_company_access(UUID);

-- Remover função can_manage_company_users se ainda existir (foi removida em remove_multi_tenant)
DROP FUNCTION IF EXISTS public.can_manage_company_users(UUID);

-- Remover outras funções relacionadas a company_users
DROP FUNCTION IF EXISTS public.can_gerente_manage_company_users(UUID, UUID);
DROP FUNCTION IF EXISTS public.gerente_create_company_user(UUID, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.gerente_update_company_user(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.gerente_delete_company_user(UUID, UUID);

-- ============================================================================
-- PARTE 2: Garantir que is_super_admin() funciona mesmo sem company_id
-- ============================================================================

-- Recriar função is_super_admin() sem depender de company_id
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
  -- IMPORTANTE: Qualificar explicitamente a coluna role e não depender de company_id
  SELECT user_profiles.role, user_profiles.is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_profiles.user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'super_admin' AND (user_active = true OR user_active IS NULL), false);
END;
$$;

-- ============================================================================
-- PARTE 3: Remover políticas RLS que dependem de company_id
-- ============================================================================

-- Verificar se company_id existe antes de remover políticas que o usam
DO $$
DECLARE
  has_company_id BOOLEAN;
BEGIN
  -- Verificar se company_id existe em cars
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cars' 
    AND column_name = 'company_id'
  ) INTO has_company_id;
  
  IF NOT has_company_id THEN
    -- Se company_id não existe, remover políticas que o verificam
    DROP POLICY IF EXISTS "Users can view cars from their company" ON public.cars;
    DROP POLICY IF EXISTS "Users can insert cars to their company" ON public.cars;
    DROP POLICY IF EXISTS "Users can update cars from their company" ON public.cars;
    DROP POLICY IF EXISTS "Users can delete cars from their company" ON public.cars;
  END IF;
  
  -- Verificar se company_id existe em customers
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'company_id'
  ) INTO has_company_id;
  
  IF NOT has_company_id THEN
    DROP POLICY IF EXISTS "Users can view customers from their company" ON public.customers;
    DROP POLICY IF EXISTS "Users can insert customers to their company" ON public.customers;
    DROP POLICY IF EXISTS "Users can update customers from their company" ON public.customers;
    DROP POLICY IF EXISTS "Users can delete customers from their company" ON public.customers;
  END IF;
  
  -- Verificar se company_id existe em reservations
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reservations' 
    AND column_name = 'company_id'
  ) INTO has_company_id;
  
  IF NOT has_company_id THEN
    DROP POLICY IF EXISTS "Users can view reservations from their company" ON public.reservations;
    DROP POLICY IF EXISTS "Users can insert reservations to their company" ON public.reservations;
    DROP POLICY IF EXISTS "Users can update reservations from their company" ON public.reservations;
    DROP POLICY IF EXISTS "Users can delete reservations from their company" ON public.reservations;
  END IF;
  
  -- Verificar se company_id existe em checkouts
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'checkouts' 
    AND column_name = 'company_id'
  ) INTO has_company_id;
  
  IF NOT has_company_id THEN
    DROP POLICY IF EXISTS "Users can view checkouts from their company" ON public.checkouts;
    DROP POLICY IF EXISTS "Users can insert checkouts to their company" ON public.checkouts;
    DROP POLICY IF EXISTS "Users can update checkouts from their company" ON public.checkouts;
    DROP POLICY IF EXISTS "Users can delete checkouts from their company" ON public.checkouts;
  END IF;
  
  -- Verificar se company_id existe em checkins
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'checkins' 
    AND column_name = 'company_id'
  ) INTO has_company_id;
  
  IF NOT has_company_id THEN
    DROP POLICY IF EXISTS "Users can view checkins from their company" ON public.checkins;
    DROP POLICY IF EXISTS "Users can insert checkins to their company" ON public.checkins;
    DROP POLICY IF EXISTS "Users can update checkins from their company" ON public.checkins;
    DROP POLICY IF EXISTS "Users can delete checkins from their company" ON public.checkins;
  END IF;
END $$;

-- ============================================================================
-- PARTE 4: Garantir que políticas permissivas estejam ativas
-- ============================================================================

-- Estas políticas já devem existir da migration 20260209000000_remove_multi_tenant.sql
-- Mas garantimos que estejam ativas mesmo se algo deu errado

-- CARS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cars' 
    AND policyname = 'Authenticated users can view cars'
  ) THEN
    CREATE POLICY "Authenticated users can view cars" ON public.cars FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- CUSTOMERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'customers' 
    AND policyname = 'Authenticated users can view customers'
  ) THEN
    CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- RESERVATIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reservations' 
    AND policyname = 'Authenticated users can view reservations'
  ) THEN
    CREATE POLICY "Authenticated users can view reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- CHECKOUTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'checkouts' 
    AND policyname = 'Authenticated users can view checkouts'
  ) THEN
    CREATE POLICY "Authenticated users can view checkouts" ON public.checkouts FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- CHECKINS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'checkins' 
    AND policyname = 'Authenticated users can view checkins'
  ) THEN
    CREATE POLICY "Authenticated users can view checkins" ON public.checkins FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================================
-- PARTE 5: Garantir que user_profiles tenha políticas corretas
-- ============================================================================

-- Remover políticas antigas que podem estar bloqueando
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;

-- Criar políticas corretas para user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all user profiles" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admins can update all user profiles" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- ============================================================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================================================

COMMENT ON FUNCTION public.is_super_admin() IS 
'Verifica se o usuário autenticado é super_admin. Não depende de company_id. Qualifica explicitamente a coluna role para evitar ambiguidade.';
