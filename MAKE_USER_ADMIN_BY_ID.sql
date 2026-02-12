-- ============================================
-- Tornar usuário admin pelo USER_ID
-- ============================================
-- Use este método se você souber o UUID do usuário
-- Você pode encontrar o UUID em: Authentication > Users no Supabase Dashboard

-- Substitua 'UUID_DO_USUARIO' pelo UUID real do usuário
UPDATE public.user_profiles
SET role = 'admin', is_active = true
WHERE user_id = 'UUID_DO_USUARIO';

-- Verificar resultado
SELECT 
  up.id,
  up.user_id,
  up.role,
  up.is_active,
  au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE up.user_id = 'UUID_DO_USUARIO';
