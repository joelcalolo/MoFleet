-- Corrige o erro PostgreSQL 22023: role "admin" does not exist
-- A função is_super_admin() deve usar user_profiles.role (e user_profiles.is_active)
-- em vez de role/is_active sozinhos, para não confundir com roles do PostgreSQL.
--
-- Aplica esta migração no teu projeto Supabase (SQL Editor ou: supabase db push)
-- se ainda tiveres a versão antiga da função e os pedidos devolverem 401 com
-- message: 'role "admin" does not exist'.

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
  SET LOCAL row_security = off;

  SELECT user_profiles.role, user_profiles.is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_profiles.user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role = 'super_admin' AND (user_active = true OR user_active IS NULL), false);
END;
$$;

COMMENT ON FUNCTION public.is_super_admin() IS
'Verifica se o usuário autenticado é super_admin. Usa user_profiles.role para evitar ambiguidade com roles do PostgreSQL.';
