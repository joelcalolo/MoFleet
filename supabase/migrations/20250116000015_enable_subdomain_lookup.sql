-- Permitir busca de companies por subdomain
-- Necessário para que useCompany possa encontrar a empresa pelo subdomain da URL

-- Função RPC para buscar company por subdomain
-- Esta função permite buscar companies por subdomain mesmo com RLS ativo
CREATE OR REPLACE FUNCTION public.get_company_by_subdomain(p_subdomain TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company RECORD;
BEGIN
  SELECT 
    c.id,
    c.name,
    c.subdomain
  INTO v_company
  FROM public.companies c
  WHERE c.subdomain = p_subdomain
  LIMIT 1;
  
  IF v_company.id IS NULL THEN
    RETURN NULL::JSON;
  END IF;
  
  RETURN json_build_object(
    'id', v_company.id,
    'name', v_company.name,
    'subdomain', v_company.subdomain
  );
END;
$$;

-- Permitir que usuários autenticados e anônimos usem esta função
GRANT EXECUTE ON FUNCTION public.get_company_by_subdomain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_by_subdomain(TEXT) TO anon;

-- Comentário
COMMENT ON FUNCTION public.get_company_by_subdomain IS 
'Permite buscar uma empresa pelo subdomain. Necessário para que o frontend possa identificar a empresa quando o usuário acessa via subdomain (ex: lore.mofleet.com).';

