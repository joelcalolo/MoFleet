-- Função para autenticar usuário da empresa (username/password)
-- Esta função permite login de company_users sem precisar estar autenticado primeiro
CREATE OR REPLACE FUNCTION public.authenticate_company_user(
  p_username TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  username TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.id,
    cu.company_id,
    cu.username,
    cu.role,
    cu.is_active
  FROM public.company_users cu
  WHERE cu.username = p_username
    AND cu.password_hash = p_password_hash
    AND cu.is_active = true;
END;
$$;

-- Permitir que usuários autenticados chamem esta função
GRANT EXECUTE ON FUNCTION public.authenticate_company_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_company_user TO anon;

