-- Migration: Create Manager User for Testing
-- This creates a manager user for testing the company user login

-- Obter a empresa existente
DO $$
DECLARE
  test_company_id UUID;
  test_subdomain TEXT;
  manager_username TEXT := 'gestor';
  manager_password TEXT := '123456';
BEGIN
  -- Obter a primeira empresa
  SELECT id, subdomain INTO test_company_id, test_subdomain 
  FROM public.companies 
  LIMIT 1;
  
  IF test_company_id IS NULL THEN
    RAISE NOTICE 'Nenhuma empresa encontrada. Crie uma empresa primeiro.';
    RETURN;
  END IF;
  
  -- Verificar se o usuário já existe
  IF EXISTS (SELECT 1 FROM public.company_users WHERE username = manager_username) THEN
    -- Atualizar senha do usuário existente
    UPDATE public.company_users 
    SET password_hash = crypt(manager_password, gen_salt('bf'))
    WHERE username = manager_username;
    RAISE NOTICE 'Usuário gestor atualizado: username=%, senha=%, subdomain=%', manager_username, manager_password, test_subdomain;
  ELSE
    -- Criar novo usuário gestor
    INSERT INTO public.company_users (
      company_id,
      username,
      password_hash,
      role,
      is_active
    ) VALUES (
      test_company_id,
      manager_username,
      crypt(manager_password, gen_salt('bf')),
      'gerente',
      true
    );
    RAISE NOTICE 'Usuário gestor criado: username=%, senha=%, subdomain=%', manager_username, manager_password, test_subdomain;
  END IF;
  
  -- Mostrar informações de login
  RAISE NOTICE '=== INFORMAÇÕES DE LOGIN ===';
  RAISE NOTICE 'Subdomain: %', test_subdomain;
  RAISE NOTICE 'Username: %', manager_username;
  RAISE NOTICE 'Senha: %', manager_password;
  RAISE NOTICE '============================';
END $$;
