-- Mono-tenant: companies é uma única empresa global para o app.
-- Apenas admin e owner (e super_admin) podem editar dados da empresa;
-- todos os utilizadores autenticados podem ler (dados globais).

-- ============================================================================
-- 1. Função can_edit_company() para RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_edit_company()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  SET LOCAL row_security = off;
  SELECT user_profiles.role, user_profiles.is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_profiles.user_id = auth.uid()
  LIMIT 1;
  RETURN COALESCE(
    (user_role IN ('admin', 'owner', 'super_admin')) AND (user_active = true OR user_active IS NULL),
    false
  );
END;
$$;

COMMENT ON FUNCTION public.can_edit_company() IS
'Mono-tenant: true se o utilizador autenticado pode editar dados da empresa (admin, owner ou super_admin).';

-- ============================================================================
-- 2. Políticas RLS em companies: leitura para todos, escrita só admin/owner
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;

-- Leitura: todos os autenticados veem a mesma empresa (dados globais)
CREATE POLICY "Companies: authenticated read"
  ON public.companies FOR SELECT TO authenticated
  USING (true);

-- Atualização: apenas admin, owner ou super_admin
CREATE POLICY "Companies: admin or owner can update"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.can_edit_company());

-- Inserção: primeiro setup (tabela vazia) qualquer autenticado; depois só admin/owner
CREATE POLICY "Companies: admin or owner can insert"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT COUNT(*) FROM public.companies) = 0
    OR public.can_edit_company()
  );

-- Eliminação: não permitir por RLS (evitar apagar a empresa global)
-- Se precisar no futuro, criar política restrita a super_admin.

COMMENT ON TABLE public.companies IS
'Mono-tenant: uma única empresa para o app. Dados editáveis por admin/owner; visíveis por todos os utilizadores autenticados.';
