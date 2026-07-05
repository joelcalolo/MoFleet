-- Migration: Create Company Function
-- This migration creates a function to easily create new companies with their owner

-- ============================================================================
-- Função para remover acentos (já existe, mas garantindo que está disponível)
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_accents(text_param text)
RETURNS text AS $$
BEGIN
  RETURN translate(
    text_param,
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Função para gerar subdomínio único
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_unique_subdomain(company_name text)
RETURNS text AS $$
DECLARE
  base_subdomain text;
  clean_name text;
  final_subdomain text;
  counter integer := 0;
BEGIN
  -- Remover acentos e converter para minúsculas
  clean_name := lower(remove_accents(company_name));
  
  -- Substituir espaços e caracteres especiais por hífens
  clean_name := regexp_replace(clean_name, '[^a-z0-9]+', '-', 'g');
  
  -- Remover hífens do início e fim
  clean_name := trim(both '-' from clean_name);
  
  -- Limitar a 50 caracteres
  base_subdomain := substring(clean_name, 1, 50);
  final_subdomain := base_subdomain;
  
  -- Verificar se já existe e adicionar número se necessário
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE subdomain = final_subdomain) LOOP
    counter := counter + 1;
    final_subdomain := substring(base_subdomain, 1, 47) || '-' || counter;
  END LOOP;
  
  RETURN final_subdomain;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Função para criar nova empresa com owner
-- ============================================================================

CREATE OR REPLACE FUNCTION create_new_company(
  p_company_name text,
  p_company_email text,
  p_owner_email text,
  p_owner_password_hash text
)
RETURNS json AS $$
DECLARE
  new_company_id uuid;
  new_user_id uuid;
  new_subdomain text;
  result json;
BEGIN
  -- Gerar subdomínio único
  new_subdomain := generate_unique_subdomain(p_company_name);
  
  -- Criar a empresa
  INSERT INTO public.companies (name, email, subdomain)
  VALUES (p_company_name, p_company_email, new_subdomain)
  RETURNING id INTO new_company_id;
  
  -- Criar o usuário no auth.users (precisa ser feito via Supabase Auth)
  -- Esta função assume que o usuário já existe no auth.users
  -- Para criar o usuário, use Supabase Auth API primeiro
  
  -- Criar o user_profile
  INSERT INTO public.user_profiles (user_id, company_id, role, full_name)
  VALUES (
    auth.uid(), -- Assume que já está autenticado
    new_company_id,
    'owner',
    split_part(p_owner_email, '@', 1)
  )
  RETURNING id INTO new_user_id;
  
  -- Retornar resultado
  result := json_build_object(
    'company_id', new_company_id,
    'user_id', new_user_id,
    'subdomain', new_subdomain,
    'success', true
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Função simplificada para criar empresa (sem usuário)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_company_only(
  p_company_name text,
  p_company_email text
)
RETURNS json AS $$
DECLARE
  new_company_id uuid;
  new_subdomain text;
  result json;
BEGIN
  -- Gerar subdomínio único
  new_subdomain := generate_unique_subdomain(p_company_name);
  
  -- Criar a empresa
  INSERT INTO public.companies (name, email, subdomain)
  VALUES (p_company_name, p_company_email, new_subdomain)
  RETURNING id INTO new_company_id;
  
  -- Retornar resultado
  result := json_build_object(
    'company_id', new_company_id,
    'subdomain', new_subdomain,
    'success', true
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissões
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_company_only(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_unique_subdomain(text) TO authenticated;
