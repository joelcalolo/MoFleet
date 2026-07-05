-- Migration: Insert Test Company User
-- This creates a test company user for testing the login functionality

-- Obter a primeira empresa existente
DO $$
DECLARE
  test_company_id UUID;
  test_subdomain TEXT;
BEGIN
  -- Obter a primeira empresa
  SELECT id, subdomain INTO test_company_id, test_subdomain 
  FROM public.companies 
  LIMIT 1;
  
  IF test_company_id IS NULL THEN
    RAISE NOTICE 'Nenhuma empresa encontrada. Crie uma empresa primeiro.';
    RETURN;
  END IF;
  
  -- Inserir usuário de teste com senha hasheada usando bcrypt
  -- Senha: 123456
  INSERT INTO public.company_users (
    company_id,
    username,
    password_hash,
    role,
    is_active
  ) VALUES (
    test_company_id,
    'teste',
    crypt('123456', gen_salt('bf')), -- Hash usando bcrypt via pgcrypto
    'gerente',
    true
  );
  
  RAISE NOTICE 'Usuário de teste criado: username=%, senha=123456, subdomain=%', 'teste', test_subdomain;
END $$;
