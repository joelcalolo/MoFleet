-- RPC para listar user_profiles com email (auth.users não exposto via PostgREST).
-- Apenas admin, owner ou super_admin podem chamar.

DROP FUNCTION IF EXISTS public.get_user_profiles_with_email();

CREATE OR REPLACE FUNCTION public.get_user_profiles_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  "position" TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  email character varying(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  caller_active BOOLEAN;
BEGIN
  SELECT up.role, up.is_active INTO caller_role, caller_active
  FROM public.user_profiles up
  WHERE up.user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS NULL OR (caller_active = false AND caller_active IS NOT NULL) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF caller_role NOT IN ('admin', 'owner', 'super_admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem listar funcionários';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.user_id,
    up.name,
    up."position",
    up.role,
    up.is_active,
    up.created_at,
    au.email
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.user_id
  ORDER BY up.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profiles_with_email() TO authenticated;

COMMENT ON FUNCTION public.get_user_profiles_with_email() IS
'Lista user_profiles com email (para Gestão de Funcionários). Apenas admin/owner/super_admin.';
