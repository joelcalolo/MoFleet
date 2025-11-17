-- Migration para permitir gestão híbrida de usuários da empresa
-- Owners/Admins (user_profiles) e Gerentes (company_users) podem gerenciar company_users

-- ============================================
-- PARTE 1: Remover políticas restritivas atuais
-- ============================================

-- Remover políticas que só permitem super_admin
DROP POLICY IF EXISTS "Super admins can create company users" ON public.company_users;
DROP POLICY IF EXISTS "Super admins can update company users" ON public.company_users;
DROP POLICY IF EXISTS "Super admins can delete company users" ON public.company_users;
DROP POLICY IF EXISTS "Super admins can view all company users" ON public.company_users;

-- ============================================
-- PARTE 2: Funções auxiliares para verificar permissões
-- ============================================

-- Função para verificar se o usuário autenticado (auth.uid()) é owner/admin da empresa
CREATE OR REPLACE FUNCTION public.can_manage_company_users(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin pode gerenciar qualquer empresa
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se é owner ou admin da empresa
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
END;
$$;

-- Função para verificar se um company_user (gerente) pode gerenciar outros company_users
-- Esta função será chamada via RPC quando um gerente precisar gerenciar usuários
CREATE OR REPLACE FUNCTION public.can_gerente_manage_company_users(
  p_company_user_id UUID,
  p_target_company_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_role TEXT;
  v_is_active BOOLEAN;
BEGIN
  -- Buscar dados do company_user
  SELECT company_id, role, is_active
  INTO v_company_id, v_role, v_is_active
  FROM public.company_users
  WHERE id = p_company_user_id;
  
  -- Verificar se o company_user existe, está ativo, é gerente e pertence à mesma empresa
  IF v_company_id IS NULL OR v_is_active = false OR v_role != 'gerente' THEN
    RETURN false;
  END IF;
  
  -- Verificar se a empresa do gerente é a mesma do target
  RETURN v_company_id = p_target_company_id;
END;
$$;

-- ============================================
-- PARTE 3: Políticas RLS para SELECT (visualizar)
-- ============================================

-- Manter política existente para visualização (já permite ver usuários da própria empresa)
-- Adicionar política para super_admin ver todos
CREATE POLICY "Super admins can view all company users" 
  ON public.company_users FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- ============================================
-- PARTE 4: Políticas RLS para INSERT (criar)
-- ============================================

-- Owners e Admins podem criar company_users na sua empresa
CREATE POLICY "Owners and admins can create company users" 
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_company_users(company_id)
  );

-- Super admins podem criar em qualquer empresa (já coberto pela função acima, mas explícito)
-- A função can_manage_company_users já verifica super_admin

-- ============================================
-- PARTE 5: Políticas RLS para UPDATE (atualizar)
-- ============================================

-- Owners e Admins podem atualizar company_users da sua empresa
CREATE POLICY "Owners and admins can update company users" 
  ON public.company_users FOR UPDATE TO authenticated
  USING (
    public.can_manage_company_users(company_id)
  );

-- ============================================
-- PARTE 6: Políticas RLS para DELETE (deletar)
-- ============================================

-- Owners e Admins podem deletar company_users da sua empresa
CREATE POLICY "Owners and admins can delete company users" 
  ON public.company_users FOR DELETE TO authenticated
  USING (
    public.can_manage_company_users(company_id)
  );

-- ============================================
-- PARTE 7: Funções RPC para gerentes gerenciarem usuários
-- ============================================

-- Função para gerente criar company_user
CREATE OR REPLACE FUNCTION public.gerente_create_company_user(
  p_company_user_id UUID,
  p_username TEXT,
  p_password_hash TEXT,
  p_role TEXT,
  p_company_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_user_id UUID;
BEGIN
  -- Verificar se o gerente tem permissão
  IF NOT public.can_gerente_manage_company_users(p_company_user_id, p_company_id) THEN
    RAISE EXCEPTION 'Você não tem permissão para criar usuários nesta empresa';
  END IF;
  
  -- Validar role
  IF p_role NOT IN ('gerente', 'tecnico') THEN
    RAISE EXCEPTION 'Role inválido. Use "gerente" ou "tecnico"';
  END IF;
  
  -- Criar o company_user
  INSERT INTO public.company_users (
    company_id,
    username,
    password_hash,
    role,
    is_active,
    created_by
  )
  VALUES (
    p_company_id,
    p_username,
    p_password_hash,
    p_role,
    true,
    NULL -- Gerentes não têm auth.user_id
  )
  RETURNING id INTO v_new_user_id;
  
  RETURN v_new_user_id;
END;
$$;

-- Função para gerente atualizar company_user
CREATE OR REPLACE FUNCTION public.gerente_update_company_user(
  p_company_user_id UUID,
  p_target_user_id UUID,
  p_username TEXT DEFAULT NULL,
  p_password_hash TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_company_id UUID;
  v_update_data JSONB := '{}'::JSONB;
BEGIN
  -- Buscar company_id do usuário alvo
  SELECT company_id INTO v_target_company_id
  FROM public.company_users
  WHERE id = p_target_user_id;
  
  IF v_target_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Verificar se o gerente tem permissão
  IF NOT public.can_gerente_manage_company_users(p_company_user_id, v_target_company_id) THEN
    RAISE EXCEPTION 'Você não tem permissão para atualizar este usuário';
  END IF;
  
  -- Construir dados de atualização
  IF p_username IS NOT NULL THEN
    v_update_data := v_update_data || jsonb_build_object('username', p_username);
  END IF;
  
  IF p_password_hash IS NOT NULL THEN
    v_update_data := v_update_data || jsonb_build_object('password_hash', p_password_hash);
  END IF;
  
  IF p_role IS NOT NULL THEN
    IF p_role NOT IN ('gerente', 'tecnico') THEN
      RAISE EXCEPTION 'Role inválido. Use "gerente" ou "tecnico"';
    END IF;
    v_update_data := v_update_data || jsonb_build_object('role', p_role);
  END IF;
  
  IF p_is_active IS NOT NULL THEN
    v_update_data := v_update_data || jsonb_build_object('is_active', p_is_active);
  END IF;
  
  -- Atualizar
  UPDATE public.company_users
  SET 
    username = COALESCE(p_username, username),
    password_hash = COALESCE(p_password_hash, password_hash),
    role = COALESCE(p_role, role),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_target_user_id;
  
  RETURN true;
END;
$$;

-- Função para gerente deletar company_user
CREATE OR REPLACE FUNCTION public.gerente_delete_company_user(
  p_company_user_id UUID,
  p_target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_company_id UUID;
BEGIN
  -- Buscar company_id do usuário alvo
  SELECT company_id INTO v_target_company_id
  FROM public.company_users
  WHERE id = p_target_user_id;
  
  IF v_target_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Verificar se o gerente tem permissão
  IF NOT public.can_gerente_manage_company_users(p_company_user_id, v_target_company_id) THEN
    RAISE EXCEPTION 'Você não tem permissão para deletar este usuário';
  END IF;
  
  -- Não permitir que gerente delete a si mesmo
  IF p_company_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'Você não pode deletar sua própria conta';
  END IF;
  
  -- Deletar
  DELETE FROM public.company_users
  WHERE id = p_target_user_id;
  
  RETURN true;
END;
$$;

-- ============================================
-- PARTE 8: Permissões
-- ============================================

-- Permitir que usuários autenticados usem as funções auxiliares
GRANT EXECUTE ON FUNCTION public.can_manage_company_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_gerente_manage_company_users(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gerente_create_company_user(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gerente_update_company_user(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gerente_delete_company_user(UUID, UUID) TO authenticated;

-- Permitir que anon use as funções de gerente (para login via company_user)
GRANT EXECUTE ON FUNCTION public.can_gerente_manage_company_users(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.gerente_create_company_user(UUID, TEXT, TEXT, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.gerente_update_company_user(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.gerente_delete_company_user(UUID, UUID) TO anon;

-- ============================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================

COMMENT ON FUNCTION public.can_manage_company_users IS 
'Verifica se o usuário autenticado (auth.uid()) pode gerenciar company_users de uma empresa. Retorna true para super_admin, owner e admin da empresa.';

COMMENT ON FUNCTION public.can_gerente_manage_company_users IS 
'Verifica se um company_user (gerente) pode gerenciar outros company_users da mesma empresa.';

COMMENT ON FUNCTION public.gerente_create_company_user IS 
'Permite que um gerente crie novos company_users na sua empresa. Deve ser chamada via RPC passando o ID do gerente logado.';

COMMENT ON FUNCTION public.gerente_update_company_user IS 
'Permite que um gerente atualize company_users da sua empresa. Deve ser chamada via RPC passando o ID do gerente logado.';

COMMENT ON FUNCTION public.gerente_delete_company_user IS 
'Permite que um gerente delete company_users da sua empresa. Deve ser chamada via RPC passando o ID do gerente logado.';

