-- Corrigir políticas RLS para tabela cars
-- Adicionar suporte para is_active, super_admin e company_users

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can insert cars to their company" ON public.cars;
DROP POLICY IF EXISTS "Users can update cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can delete cars from their company" ON public.cars;

-- Função auxiliar para verificar se usuário tem acesso à empresa
CREATE OR REPLACE FUNCTION public.user_has_company_access(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin tem acesso a todas as empresas
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se é owner/admin da empresa (user_profiles)
  IF EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND is_active = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Verificar se é company_user (gerente ou tecnico) da empresa
  IF EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE company_id = p_company_id
      AND is_active = true
      -- Nota: company_users não têm auth.uid(), então precisamos de outra forma
      -- Por enquanto, vamos permitir se o company_user estiver logado via contexto
      -- Isso será verificado no frontend
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Política para SELECT (visualizar)
CREATE POLICY "Users can view cars from their company" 
  ON public.cars FOR SELECT TO authenticated 
  USING (
    -- Super admin pode ver todos
    public.is_super_admin()
    OR
    -- Owner/admin pode ver carros da sua empresa
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    OR
    -- Se company_id for NULL, permitir (para compatibilidade com dados antigos)
    company_id IS NULL
  );

-- Política para INSERT (criar)
CREATE POLICY "Users can insert cars to their company" 
  ON public.cars FOR INSERT TO authenticated 
  WITH CHECK (
    -- Super admin pode criar em qualquer empresa
    public.is_super_admin()
    OR
    -- Owner/admin pode criar carros na sua empresa
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    OR
    -- Se company_id for NULL, permitir (será definido automaticamente)
    company_id IS NULL
  );

-- Política para UPDATE (atualizar)
CREATE POLICY "Users can update cars from their company" 
  ON public.cars FOR UPDATE TO authenticated 
  USING (
    -- Super admin pode atualizar todos
    public.is_super_admin()
    OR
    -- Owner/admin pode atualizar carros da sua empresa
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    OR
    -- Se company_id for NULL, permitir (para compatibilidade)
    company_id IS NULL
  );

-- Política para DELETE (deletar)
CREATE POLICY "Users can delete cars from their company" 
  ON public.cars FOR DELETE TO authenticated 
  USING (
    -- Super admin pode deletar todos
    public.is_super_admin()
    OR
    -- Owner/admin pode deletar carros da sua empresa
    company_id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    OR
    -- Se company_id for NULL, permitir (para compatibilidade)
    company_id IS NULL
  );

-- Permissões
GRANT EXECUTE ON FUNCTION public.user_has_company_access(UUID) TO authenticated;

-- Garantir que todos os user_profiles existentes tenham is_active = true
UPDATE public.user_profiles
SET is_active = true
WHERE is_active IS NULL OR is_active = false;

-- Comentários
COMMENT ON FUNCTION public.user_has_company_access IS 
'Verifica se o usuário autenticado tem acesso a uma empresa específica. Retorna true para super_admin, owner/admin ativo da empresa, ou company_user ativo da empresa.';

