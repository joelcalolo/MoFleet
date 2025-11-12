-- Esta migration cria o usuário inicial admin
-- IMPORTANTE: Execute esta migration manualmente após configurar o Supabase
-- O usuário será criado com:
-- Email: admin@mail.com
-- Senha: senha123
-- Role: super_admin
-- must_change_password: true (força redefinição na primeira entrada)

-- Função para criar o usuário admin inicial
CREATE OR REPLACE FUNCTION public.create_initial_admin()
RETURNS void AS $$
DECLARE
  admin_user_id UUID;
  admin_company_id UUID;
BEGIN
  -- Verificar se já existe um super admin
  IF EXISTS (
    SELECT 1 FROM public.user_profiles WHERE role = 'super_admin'
  ) THEN
    RAISE NOTICE 'Super admin já existe. Pulando criação.';
    RETURN;
  END IF;

  -- Criar empresa padrão para o admin
  INSERT INTO public.companies (name, email)
  VALUES ('Sistema Administrativo', 'admin@mail.com')
  RETURNING id INTO admin_company_id;

  -- NOTA: O usuário precisa ser criado manualmente via Supabase Auth
  -- ou via API do Supabase. Esta função apenas cria o perfil.
  -- Para criar o usuário, use o Supabase Dashboard ou execute:
  -- 
  -- INSERT INTO auth.users (
  --   instance_id,
  --   id,
  --   aud,
  --   role,
  --   email,
  --   encrypted_password,
  --   email_confirmed_at,
  --   created_at,
  --   updated_at,
  --   raw_app_meta_data,
  --   raw_user_meta_data
  -- ) VALUES (
  --   '00000000-0000-0000-0000-000000000000',
  --   gen_random_uuid(),
  --   'authenticated',
  --   'authenticated',
  --   'admin@mail.com',
  --   crypt('senha123', gen_salt('bf')),
  --   now(),
  --   now(),
  --   now(),
  --   '{"provider":"email","providers":["email"]}',
  --   '{}'
  -- );

  RAISE NOTICE 'Por favor, crie o usuário admin@mail.com manualmente via Supabase Dashboard ou API.';
  RAISE NOTICE 'Após criar, execute: UPDATE public.user_profiles SET role = ''super_admin'', must_change_password = true WHERE user_id = (SELECT id FROM auth.users WHERE email = ''admin@mail.com'');';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a função
SELECT public.create_initial_admin();

