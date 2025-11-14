-- Adicionar campo subdomain na tabela companies
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_companies_subdomain ON public.companies(subdomain);

-- Remover função antiga de autenticação (se existir com assinatura diferente)
-- A função antiga tinha apenas 2 parâmetros (username, password_hash)
-- A nova terá 3 parâmetros (subdomain, username, password_hash)
DROP FUNCTION IF EXISTS public.authenticate_company_user(TEXT, TEXT);

-- Atualizar função de autenticação para usar subdomain
CREATE OR REPLACE FUNCTION public.authenticate_company_user(
  p_subdomain TEXT,
  p_username TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  username TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.id,
    cu.company_id,
    cu.username,
    cu.role,
    cu.is_active
  FROM public.company_users cu
  INNER JOIN public.companies c ON c.id = cu.company_id
  WHERE c.subdomain = p_subdomain
    AND cu.username = p_username
    AND cu.password_hash = p_password_hash
    AND cu.is_active = true;
END;
$$;

-- Permitir que usuários autenticados chamem esta função
GRANT EXECUTE ON FUNCTION public.authenticate_company_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_company_user TO anon;

-- Criar extensão para remover acentos (se não existir)
-- Nota: Se a extensão não estiver disponível, a função usará uma alternativa
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS unaccent;
EXCEPTION
  WHEN OTHERS THEN
    -- Se não conseguir criar a extensão, continuar sem ela
    NULL;
END $$;

-- Função auxiliar para remover acentos (fallback se unaccent não estiver disponível)
CREATE OR REPLACE FUNCTION public.remove_accents(text_in TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Se unaccent estiver disponível, usar
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    RETURN unaccent(text_in);
  ELSE
    -- Fallback: substituir acentos manualmente
    RETURN translate(
      text_in,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeeiiiiooooouuuucAAAAAEEEEEIIIIOOOOOUUUUC'
    );
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar função que cria empresa automaticamente para gerar subdomain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
  generated_subdomain TEXT;
  subdomain_counter INTEGER := 0;
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

  -- Criar user profile
  INSERT INTO public.user_profiles (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

