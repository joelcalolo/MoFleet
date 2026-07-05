-- Migration: Fix get_user_profiles_with_email to filter by company_id
-- This ensures that users can only see user_profiles from their own company

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
  caller_company_id UUID;
BEGIN
  SELECT up.role, up.is_active, up.company_id INTO caller_role, caller_active, caller_company_id
  FROM public.user_profiles up
  WHERE up.user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS NULL OR (caller_active = false AND caller_active IS NOT NULL) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF caller_role NOT IN ('admin', 'owner', 'super_admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem listar funcionários';
  END IF;

  -- Se for super_admin, pode ver todos (opcional - remover se quiser isolamento total)
  IF caller_role = 'super_admin' THEN
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
  ELSE
    -- Para admin e owner, apenas ver da própria empresa
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
    WHERE up.company_id = caller_company_id
    ORDER BY up.created_at DESC;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profiles_with_email() TO authenticated;

COMMENT ON FUNCTION public.get_user_profiles_with_email() IS
'Lista user_profiles com email (para Gestão de Funcionários). Apenas admin/owner/super_admin. Filtra por company_id para isolamento multi-tenant.';
