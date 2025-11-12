-- Função para buscar usuários com email (para uso no admin)
-- Esta função permite que super admins vejam os emails dos usuários

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

-- Dar permissão para authenticated users executarem (mas a função verifica se é super admin)
GRANT EXECUTE ON FUNCTION public.get_users_with_email() TO authenticated;

