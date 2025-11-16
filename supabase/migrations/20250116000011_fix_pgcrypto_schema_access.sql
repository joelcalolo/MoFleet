-- Garantir que pgcrypto esteja acessível na função handle_new_user
-- Esta migration corrige o problema quando pgcrypto está instalada mas não acessível

-- Atualizar função handle_new_user para garantir acesso ao pgcrypto
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
  
  -- Fazer hash da senha usando SHA-256
  -- Tentar múltiplas formas de acessar pgcrypto
  BEGIN
    -- Verificar se a extensão está instalada
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
      RAISE EXCEPTION 'Extensão pgcrypto não está instalada. Por favor, habilite-a no Supabase Dashboard: Database > Extensions > pgcrypto > Enable';
    END IF;
    
    -- Tentar usar pgcrypto.digest() com schema explícito
    BEGIN
      PERFORM set_config('search_path', 'public, pgcrypto', false);
      admin_password_hash := encode(digest(admin_password, 'sha256'), 'hex');
    EXCEPTION
      WHEN OTHERS THEN
        -- Se falhar, tentar com schema explícito
        BEGIN
          admin_password_hash := encode(pgcrypto.digest(admin_password, 'sha256'), 'hex');
        EXCEPTION
          WHEN OTHERS THEN
            -- Última tentativa: usar diretamente
            admin_password_hash := encode(public.digest(admin_password, 'sha256'), 'hex');
        END;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se ainda falhar, dar erro claro
      RAISE EXCEPTION 'Erro ao fazer hash da senha. Verifique se pgcrypto está habilitada e acessível. Erro: %', SQLERRM;
  END;
  
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
    'gerente',
    true,
    NEW.id
  );
  
  -- Armazenar senha temporariamente em uma tabela auxiliar para exibir ao usuário
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

  -- Enviar email com credenciais (tentar, mas não falhar se não conseguir)
  BEGIN
    PERFORM public.send_credentials_email(
      NEW.email,
      company_name,
      generated_subdomain,
      admin_username,
      admin_password
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Não falhar se o email não puder ser enviado
      -- As credenciais ainda estarão disponíveis na página de boas-vindas
      RAISE NOTICE 'Email de credenciais não pôde ser enviado: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgcrypto;

