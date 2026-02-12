-- ============================================
-- Script SQL para transformar um usuário em administrador
-- ============================================
-- INSTRUÇÕES:
-- 1. Substitua 'email@exemplo.com' pelo email do usuário que deseja tornar admin
-- 2. Execute este script no SQL Editor do Supabase
-- 3. Se der erro de permissão, execute como superuser ou use a função helper abaixo

-- ============================================
-- PASSO 1: Verificar se o usuário existe
-- ============================================
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'email@exemplo.com';

-- ============================================
-- PASSO 2: Verificar se o perfil existe
-- ============================================
SELECT 
  up.id,
  up.user_id,
  up.role,
  up.is_active,
  up.company_id,
  au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email = 'email@exemplo.com';

-- ============================================
-- PASSO 3: Tornar admin (escolha uma opção)
-- ============================================

-- OPÇÃO A: Tornar admin pelo email (método direto)
-- Se der erro de RLS, use a OPÇÃO B ou C
UPDATE public.user_profiles
SET 
  role = 'admin',
  is_active = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'email@exemplo.com'
);

-- OPÇÃO B: Tornar admin pelo user_id (se você souber o ID)
-- Descomente e substitua o UUID:
-- UPDATE public.user_profiles
-- SET 
--   role = 'admin',
--   is_active = true
-- WHERE user_id = 'UUID_DO_USUARIO_AQUI';

-- OPÇÃO C: Usar função SECURITY DEFINER (bypassa RLS)
-- Esta função permite atualizar mesmo com RLS ativo
CREATE OR REPLACE FUNCTION public.make_user_admin(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', p_email;
  END IF;
  
  -- Verificar se perfil existe
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = v_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado. O usuário precisa ter feito login pelo menos uma vez.';
  END IF;
  
  -- Atualizar role para admin
  UPDATE public.user_profiles
  SET 
    role = 'admin',
    is_active = true
  WHERE user_id = v_user_id;
  
  RETURN TRUE;
END;
$$;

-- Executar a função (substitua o email):
SELECT public.make_user_admin('email@exemplo.com');

-- OPÇÃO D: Tornar super_admin (acesso total ao sistema)
-- Use apenas se precisar de acesso total:
UPDATE public.user_profiles
SET 
  role = 'super_admin',
  is_active = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'email@exemplo.com'
);

-- Ou usando a função:
CREATE OR REPLACE FUNCTION public.make_user_super_admin(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', p_email;
  END IF;
  
  UPDATE public.user_profiles
  SET 
    role = 'super_admin',
    is_active = true
  WHERE user_id = v_user_id;
  
  RETURN TRUE;
END;
$$;

-- Executar para tornar super_admin:
-- SELECT public.make_user_super_admin('email@exemplo.com');

-- ============================================
-- PASSO 4: Verificar se a atualização foi bem-sucedida
-- ============================================
SELECT 
  up.id,
  up.user_id,
  up.role,
  up.is_active,
  up.company_id,
  au.email,
  au.created_at as user_created_at
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email = 'email@exemplo.com';

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- Se ainda não funcionar:
-- 1. Verifique se o usuário existe: SELECT * FROM auth.users WHERE email = 'email@exemplo.com';
-- 2. Verifique se o perfil existe: SELECT * FROM public.user_profiles WHERE user_id = 'USER_ID';
-- 3. Se o perfil não existir, o usuário precisa fazer login pelo menos uma vez
-- 4. Execute como superuser no Supabase SQL Editor (tem permissões especiais)
