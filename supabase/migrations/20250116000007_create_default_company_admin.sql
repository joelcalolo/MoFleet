-- Função para gerar senha aleatória de 6 dígitos
-- Formato: letra, caractere especial, número (ex: a@1b#2)
CREATE OR REPLACE FUNCTION public.generate_random_password()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  password TEXT := '';
  chars_lower TEXT := 'abcdefghijklmnopqrstuvwxyz';
  chars_upper TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  chars_special TEXT := '@#$%&*!';
  chars_numbers TEXT := '0123456789';
  all_chars TEXT := chars_lower || chars_upper || chars_special || chars_numbers;
  i INTEGER;
  random_char TEXT;
BEGIN
  -- Garantir que tenha pelo menos: 1 letra, 1 caractere especial, 1 número
  -- Posição 0: letra
  password := password || SUBSTRING(chars_lower || chars_upper FROM floor(random() * LENGTH(chars_lower || chars_upper) + 1)::INTEGER FOR 1);
  
  -- Posição 1: caractere especial
  password := password || SUBSTRING(chars_special FROM floor(random() * LENGTH(chars_special) + 1)::INTEGER FOR 1);
  
  -- Posição 2: número
  password := password || SUBSTRING(chars_numbers FROM floor(random() * LENGTH(chars_numbers) + 1)::INTEGER FOR 1);
  
  -- Preencher os 3 caracteres restantes aleatoriamente
  FOR i IN 1..3 LOOP
    random_char := SUBSTRING(all_chars FROM floor(random() * LENGTH(all_chars) + 1)::INTEGER FOR 1);
    password := password || random_char;
  END LOOP;
  
  -- Embaralhar a senha para não ter padrão previsível
  -- Usar uma abordagem simples de trocar posições
  password := SUBSTRING(password FROM 4 FOR 1) || 
              SUBSTRING(password FROM 2 FOR 1) || 
              SUBSTRING(password FROM 5 FOR 1) || 
              SUBSTRING(password FROM 1 FOR 1) || 
              SUBSTRING(password FROM 6 FOR 1) || 
              SUBSTRING(password FROM 3 FOR 1);
  
  RETURN password;
END;
$$;

-- Atualizar função handle_new_user para criar company_user admin automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
  generated_subdomain TEXT;
  subdomain_counter INTEGER := 0;
  admin_password TEXT;
  admin_password_hash TEXT;
  admin_username TEXT := 'admin';
BEGIN
  -- Obter nome da empresa
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa');
  
  -- Gerar subdomain baseado no nome
  generated_subdomain := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        public.remove_accents(company_name),
        '[^a-z0-9]', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  generated_subdomain := TRIM(BOTH '-' FROM generated_subdomain);
  generated_subdomain := SUBSTRING(generated_subdomain FROM 1 FOR 50);
  
  -- Se subdomain estiver vazio, usar padrão
  IF generated_subdomain = '' OR generated_subdomain IS NULL THEN
    generated_subdomain := 'empresa-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
  END IF;
  
  -- Verificar se subdomain já existe e adicionar número se necessário
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE subdomain = generated_subdomain || CASE WHEN subdomain_counter > 0 THEN '-' || subdomain_counter::TEXT ELSE '' END) LOOP
    subdomain_counter := subdomain_counter + 1;
  END LOOP;
  
  IF subdomain_counter > 0 THEN
    generated_subdomain := generated_subdomain || '-' || subdomain_counter::TEXT;
  END IF;
  
  -- Criar empresa com subdomain
  INSERT INTO public.companies (name, email, subdomain)
  VALUES (company_name, NEW.email, generated_subdomain)
  RETURNING id INTO new_company_id;

  -- Criar user profile (owner)
  INSERT INTO public.user_profiles (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'owner');

  -- Gerar senha aleatória para o admin da empresa
  admin_password := public.generate_random_password();
  
  -- Fazer hash da senha usando SHA-256 (mesmo algoritmo usado no frontend)
  -- O frontend usa Web Crypto API que gera hash SHA-256 em hexadecimal
  admin_password_hash := encode(digest(admin_password, 'sha256'), 'hex');
  
  -- Verificar se username 'admin' já existe para esta empresa, se sim, adicionar número
  IF EXISTS (SELECT 1 FROM public.company_users WHERE company_id = new_company_id AND username = admin_username) THEN
    admin_username := 'admin-1';
  END IF;
  
  -- Criar company_user admin automaticamente
  INSERT INTO public.company_users (
    company_id,
    username,
    password_hash,
    role,
    is_active,
    created_by
  )
  VALUES (
    new_company_id,
    admin_username,
    admin_password_hash,
    'gerente', -- Gerente tem acesso completo
    true,
    NEW.id
  );
  
  -- Armazenar senha temporariamente em uma tabela auxiliar para exibir ao usuário
  -- Criar tabela temporária se não existir
  CREATE TABLE IF NOT EXISTS public.company_setup_credentials (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subdomain TEXT NOT NULL,
    admin_username TEXT NOT NULL,
    admin_password TEXT NOT NULL,
    shown BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Habilitar RLS na tabela
  ALTER TABLE public.company_setup_credentials ENABLE ROW LEVEL SECURITY;
  
  -- Política RLS: usuários podem ver apenas suas próprias credenciais
  DROP POLICY IF EXISTS "Users can view their own setup credentials" ON public.company_setup_credentials;
  CREATE POLICY "Users can view their own setup credentials" 
    ON public.company_setup_credentials FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  
  -- Política RLS: usuários podem atualizar apenas suas próprias credenciais
  DROP POLICY IF EXISTS "Users can update their own setup credentials" ON public.company_setup_credentials;
  CREATE POLICY "Users can update their own setup credentials" 
    ON public.company_setup_credentials FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
  
  -- Inserir credenciais temporárias
  INSERT INTO public.company_setup_credentials (
    user_id,
    subdomain,
    admin_username,
    admin_password
  )
  VALUES (
    NEW.id,
    generated_subdomain,
    admin_username,
    admin_password
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    subdomain = EXCLUDED.subdomain,
    admin_username = EXCLUDED.admin_username,
    admin_password = EXCLUDED.admin_password,
    shown = false;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

