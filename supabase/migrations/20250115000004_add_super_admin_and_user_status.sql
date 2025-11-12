-- Adicionar role 'super_admin' ao CHECK constraint
ALTER TABLE public.user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;
  
ALTER TABLE public.user_profiles 
  ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('super_admin', 'owner', 'admin', 'user'));

-- Adicionar campo is_active para controlar se usuário está ativo
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Adicionar campo para controlar se precisa redefinir senha/email na primeira entrada
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Atualizar políticas RLS para permitir super admins ver todas as empresas
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
CREATE POLICY "Super admins can view all companies" 
  ON public.companies FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR
    id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update all companies" ON public.companies;
CREATE POLICY "Super admins can update all companies" 
  ON public.companies FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR
    id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins can delete all companies" ON public.companies;
CREATE POLICY "Super admins can delete all companies" 
  ON public.companies FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
  );

-- Função auxiliar para verificar se é super admin (evita recursão)
-- SECURITY DEFINER permite bypassar RLS para evitar recursão
-- VOLATILE permite usar SET LOCAL
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
  SELECT role, is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'super_admin' AND user_active = true, false);
END;
$$;

-- Políticas para super admins verem todos os user_profiles
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
CREATE POLICY "Super admins can view all user profiles" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;
CREATE POLICY "Super admins can update all user profiles" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
  );

-- Atualizar políticas existentes para considerar is_active
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

-- Atualizar políticas de companies para considerar is_active
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" 
  ON public.companies FOR SELECT TO authenticated 
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
CREATE POLICY "Users can update their own company" 
  ON public.companies FOR UPDATE TO authenticated 
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

