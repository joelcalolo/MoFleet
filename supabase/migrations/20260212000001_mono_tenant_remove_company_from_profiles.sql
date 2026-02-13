-- Mono-tenant: remover company_id de user_profiles, trigger e backfill sem empresas,
-- e permitir que admin (e super_admin) gerem todos os perfis.

-- ============================================================================
-- 1. Remover coluna company_id de user_profiles (se existir)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'company_id') THEN
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN company_id DROP NOT NULL';
    EXECUTE 'ALTER TABLE public.user_profiles DROP COLUMN company_id';
  END IF;
END $$;

-- ============================================================================
-- 2. handle_new_user(): apenas user_profiles (user_id, role, is_active)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, is_active)
  VALUES (NEW.id, 'user', true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Mono-tenant: cria apenas user_profile (user_id, role=user, is_active) para cada novo auth.users.';

-- ============================================================================
-- 3. Backfill: user_profiles para auth.users sem perfil (sem company_id)
-- ============================================================================
INSERT INTO public.user_profiles (user_id, role, is_active)
SELECT u.id, 'user', true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id);

-- ============================================================================
-- 4. Função is_admin() para RLS (role qualificado)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
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
  RETURN COALESCE(
    (user_role IN ('admin', 'super_admin')) AND (user_active = true OR user_active IS NULL),
    false
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
'True se o utilizador autenticado tem role admin ou super_admin (para gerir user_profiles).';

-- ============================================================================
-- 5. Políticas RLS: admin pode ver e atualizar todos os user_profiles
-- ============================================================================
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;

CREATE POLICY "Admins can view all user profiles"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all user profiles"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_admin());
