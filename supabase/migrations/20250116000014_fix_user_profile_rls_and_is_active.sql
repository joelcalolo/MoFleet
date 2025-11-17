-- Corrigir políticas RLS de user_profiles e garantir is_active
-- Esta migration garante que usuários possam ler seu próprio perfil mesmo se is_active for NULL

-- Garantir que todos os user_profiles tenham is_active = true
UPDATE public.user_profiles
SET is_active = true
WHERE is_active IS NULL OR is_active = false;

-- Atualizar políticas RLS para user_profiles
-- Permitir que usuários leiam seu próprio perfil mesmo se is_active for NULL (compatibilidade)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    AND (is_active = true OR is_active IS NULL)
  );

-- Política para super admins verem todos os perfis
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
CREATE POLICY "Super admins can view all user profiles" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Política para usuários atualizarem seu próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() 
    AND (is_active = true OR is_active IS NULL)
  );

-- Política para super admins atualizarem todos os perfis
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;
CREATE POLICY "Super admins can update all user profiles" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- Comentários explicativos
COMMENT ON POLICY "Users can view their own profile" ON public.user_profiles IS 
'Permite que usuários autenticados vejam seu próprio perfil, mesmo se is_active for NULL (compatibilidade com dados antigos).';

