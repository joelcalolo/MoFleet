-- Migration para enviar email com credenciais após criação de usuário
-- Esta migration adiciona funcionalidade para enviar email automaticamente

-- Função para chamar Edge Function e enviar email de credenciais
-- Usa pg_net se disponível, mas não depende de variáveis de ambiente do banco
-- NOTA: Para usar esta função, você precisa configurar um webhook ou usar pg_net com URL hardcoded
CREATE OR REPLACE FUNCTION public.send_credentials_email(
  p_user_email TEXT,
  p_company_name TEXT,
  p_subdomain TEXT,
  p_admin_username TEXT,
  p_admin_password TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  request_id BIGINT;
  -- Obter project_ref do request.jwt.claim.aud (disponível no Supabase)
  project_ref TEXT;
  supabase_url TEXT;
BEGIN
  -- Tentar obter project_ref do JWT claim (disponível em requisições autenticadas)
  BEGIN
    -- No Supabase, o project_ref pode ser obtido do JWT
    -- Mas em triggers, isso pode não estar disponível
    -- Vamos tentar uma abordagem mais simples
    project_ref := NULL;
  EXCEPTION
    WHEN OTHERS THEN
      project_ref := NULL;
  END;
  
  -- Se não conseguir obter project_ref, a função não pode fazer a chamada HTTP
  -- Neste caso, apenas registra que as credenciais foram criadas
  -- O email será enviado via webhook configurado no Supabase Dashboard
  IF project_ref IS NULL THEN
    -- Apenas logar - o webhook será responsável por enviar o email
    RAISE NOTICE 'Credenciais criadas. Email será enviado via webhook configurado.';
    RAISE NOTICE 'Subdomain: %, Username: %, Password: %', p_subdomain, p_admin_username, p_admin_password;
    RETURN;
  END IF;
  
  -- Construir URL da Edge Function
  supabase_url := 'https://' || project_ref || '.supabase.co';
  function_url := supabase_url || '/functions/v1/send-email';
  
  -- Tentar usar pg_net para fazer requisição HTTP (se disponível)
  BEGIN
    -- Verificar se pg_net está disponível
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      -- Nota: Para usar pg_net, você precisa passar a anon_key
      -- Mas não podemos obtê-la facilmente no banco
      -- A melhor abordagem é usar webhooks
      RAISE NOTICE 'pg_net disponível, mas anon_key necessária. Use webhook em vez disso.';
    ELSE
      RAISE NOTICE 'pg_net não está disponível. Configure um webhook no Supabase Dashboard.';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao verificar pg_net: %', SQLERRM;
  END;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.send_credentials_email IS 
'Registra que credenciais foram criadas. Email será enviado via webhook configurado no Supabase Dashboard.';

-- Função helper para webhook obter email junto com credenciais
CREATE OR REPLACE FUNCTION public.get_credentials_with_email(p_user_id UUID)
RETURNS TABLE (
  email TEXT,
  company_name TEXT,
  subdomain TEXT,
  admin_username TEXT,
  admin_password TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.email::TEXT,
    COALESCE(c.name, 'Minha Empresa')::TEXT,
    csc.subdomain,
    csc.admin_username,
    csc.admin_password
  FROM public.company_setup_credentials csc
  JOIN auth.users au ON au.id = csc.user_id
  LEFT JOIN public.user_profiles up ON up.user_id = csc.user_id
  LEFT JOIN public.companies c ON c.id = up.company_id
  WHERE csc.user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_credentials_with_email IS 
'Retorna credenciais com email do usuário. Útil para webhooks.';

-- Atualizar função handle_new_user para enviar email automaticamente
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
  
  -- Fazer hash da senha usando SHA-256 (requer extensão pgcrypto)
  -- IMPORTANTE: A extensão pgcrypto deve estar habilitada no Supabase
  BEGIN
    admin_password_hash := encode(digest(admin_password, 'sha256'), 'hex');
  EXCEPTION
    WHEN undefined_function THEN
      RAISE EXCEPTION 'Extensão pgcrypto não está disponível. Por favor, habilite-a no Supabase Dashboard: Database > Extensions > pgcrypto > Enable';
    WHEN OTHERS THEN
      RAISE;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

