-- Corrigir ambiguidade do nome "role" nas políticas RLS e funções SQL
-- O PostgreSQL pode interpretar "admin" como um role do PostgreSQL em vez de um valor de string
-- Esta migration qualifica explicitamente todas as referências à coluna "role"
-- 
-- PROBLEMA: Quando você usa `role IN ('owner', 'admin')` em uma subquery dentro de uma política RLS,
-- o PostgreSQL pode interpretar "admin" como um role do PostgreSQL em vez de um valor de string.
-- Isso causa o erro: role "admin" does not exist
--
-- SOLUÇÃO: Qualificar explicitamente a coluna usando `user_profiles.role` ou `up.role`

-- Corrigir políticas RLS de company_users que usam role IN ('owner', 'admin') diretamente
-- Estas políticas são da migration 20250116000002_create_company_users.sql
-- Elas podem ser substituídas pela migration 20250116000012, mas corrigimos para garantir compatibilidade
-- Verificar se a tabela company_users existe antes de criar políticas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_users'
  ) THEN
    -- Corrigir políticas RLS apenas se a tabela existir
    DROP POLICY IF EXISTS "Owners and admins can create company users" ON public.company_users;
    CREATE POLICY "Owners and admins can create company users" 
      ON public.company_users FOR INSERT TO authenticated
      WITH CHECK (
        company_id IN (
          SELECT company_id FROM public.user_profiles 
          WHERE user_id = auth.uid() 
          AND user_profiles.role IN ('owner', 'admin')
        )
      );

    DROP POLICY IF EXISTS "Owners and admins can update company users" ON public.company_users;
    CREATE POLICY "Owners and admins can update company users" 
      ON public.company_users FOR UPDATE TO authenticated
      USING (
        company_id IN (
          SELECT company_id FROM public.user_profiles 
          WHERE user_id = auth.uid() 
          AND user_profiles.role IN ('owner', 'admin')
        )
      );

    DROP POLICY IF EXISTS "Owners and admins can delete company users" ON public.company_users;
    CREATE POLICY "Owners and admins can delete company users" 
      ON public.company_users FOR DELETE TO authenticated
      USING (
        company_id IN (
          SELECT company_id FROM public.user_profiles 
          WHERE user_id = auth.uid() 
          AND user_profiles.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- Corrigir função can_manage_company_users
-- Esta função é usada pelas políticas RLS em 20250116000012_enable_hybrid_user_management.sql
-- Ao corrigir esta função, todas as políticas que a usam serão automaticamente corrigidas
-- CREATE OR REPLACE funciona mesmo se a função não existir
-- IMPORTANTE: Mesmo que a função tenha sido removida em 20260209000000_remove_multi_tenant.sql,
-- ela pode ter sido recriada ou ainda estar em cache, então corrigimos aqui também
CREATE OR REPLACE FUNCTION public.can_manage_company_users(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin pode gerenciar qualquer empresa
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se é owner ou admin da empresa (qualificar explicitamente a coluna role)
  -- IMPORTANTE: Usar user_profiles.role em vez de apenas role para evitar ambiguidade
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.company_id = p_company_id
      AND user_profiles.role IN ('owner', 'admin')
      AND user_profiles.is_active = true
  );
END;
$$;

-- Corrigir função is_super_admin se ela ainda usar role sem qualificar
-- Esta função é crítica e é usada em muitas políticas RLS
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
  -- IMPORTANTE: Qualificar explicitamente a coluna role
  SELECT user_profiles.role, user_profiles.is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_profiles.user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'super_admin' AND user_active = true, false);
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION public.can_manage_company_users(UUID) IS 
'Verifica se o usuário autenticado (auth.uid()) pode gerenciar company_users de uma empresa. Retorna true para super_admin, owner e admin da empresa. A função qualifica explicitamente a coluna role para evitar ambiguidade com roles do PostgreSQL.';

COMMENT ON FUNCTION public.is_super_admin() IS 
'Verifica se o usuário autenticado é super_admin. A função qualifica explicitamente a coluna role para evitar ambiguidade com roles do PostgreSQL.';

-- Forçar recriação de políticas RLS críticas que podem estar causando o problema
-- Isso garante que todas as políticas usem as funções corrigidas acima
DO $$
BEGIN
  -- Recriar políticas de user_profiles que podem estar usando role sem qualificar
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    -- Remover e recriar políticas que podem ter subqueries problemáticas
    DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
    CREATE POLICY "Super admins can view all user profiles" 
      ON public.user_profiles FOR SELECT TO authenticated
      USING (public.is_super_admin() OR user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;
    CREATE POLICY "Super admins can update all user profiles" 
      ON public.user_profiles FOR UPDATE TO authenticated
      USING (public.is_super_admin() OR user_id = auth.uid());
  END IF;
END $$;

-- IMPORTANTE: Se ainda houver erros após esta migration, execute este SQL no Supabase para identificar políticas problemáticas:
-- 
-- SELECT schemaname, tablename, policyname, 
--        pg_get_expr(polqual, polrelid) as using_expression,
--        pg_get_expr(polwithcheck, polrelid) as with_check_expression
-- FROM pg_policy
-- WHERE schemaname = 'public'
-- AND (pg_get_expr(polqual, polrelid) LIKE '%role%' OR pg_get_expr(polwithcheck, polrelid) LIKE '%role%')
-- AND (pg_get_expr(polqual, polrelid) NOT LIKE '%user_profiles.role%' 
--      AND pg_get_expr(polqual, polrelid) NOT LIKE '%up.role%'
--      AND pg_get_expr(polwithcheck, polrelid) NOT LIKE '%user_profiles.role%'
--      AND pg_get_expr(polwithcheck, polrelid) NOT LIKE '%up.role%');
