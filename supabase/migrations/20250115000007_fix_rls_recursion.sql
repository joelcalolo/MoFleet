-- Esta migration corrige a recursão infinita nas políticas RLS
-- O problema era que as políticas estavam consultando user_profiles dentro de outras políticas de user_profiles

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

-- Recriar políticas de user_profiles sem recursão
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all user profiles" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Política para usuários atualizarem seu próprio perfil (mais específica primeiro)
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Política para super admins atualizarem todos os perfis (menos específica)
CREATE POLICY "Super admins can update all user profiles" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- Recriar políticas de companies sem recursão
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can update all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can delete all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

CREATE POLICY "Users can view their own company" 
  ON public.companies FOR SELECT TO authenticated 
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all companies" 
  ON public.companies FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Users can update their own company" 
  ON public.companies FOR UPDATE TO authenticated 
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can update all companies" 
  ON public.companies FOR UPDATE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admins can delete all companies" 
  ON public.companies FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- Atualizar função get_users_with_email para usar a função auxiliar
CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  company_id UUID,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  company_name TEXT,
  email TEXT,
  email_confirmed_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Apenas super admins podem acessar esta função';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.company_id,
    up.role,
    up.is_active,
    up.created_at,
    c.name as company_name,
    au.email,
    au.email_confirmed_at
  FROM public.user_profiles up
  LEFT JOIN public.companies c ON c.id = up.company_id
  LEFT JOIN auth.users au ON au.id = up.user_id
  ORDER BY up.created_at DESC;
END;
$$;

