-- ============================================
-- VERSÃO SIMPLIFICADA - Tornar usuário admin
-- ============================================
-- Substitua 'email@exemplo.com' pelo email do usuário

-- Método mais simples e direto (execute no Supabase SQL Editor)
UPDATE public.user_profiles
SET role = 'admin', is_active = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'email@exemplo.com'
);

-- Verificar resultado
SELECT 
  up.role,
  up.is_active,
  au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email = 'email@exemplo.com';
