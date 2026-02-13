-- Corrigir políticas RLS para garantir que usuários autenticados possam ver todos os dados
-- A única restrição deve ser para gerenciar funcionários (user_profiles)
-- 
-- PROBLEMA: Políticas RLS antigas baseadas em company_id ou role estão bloqueando acesso
-- SOLUÇÃO: Remover todas as políticas antigas e garantir políticas simples que permitem acesso

-- ============================================================================
-- REMOVER TODAS AS POLÍTICAS ANTIGAS QUE PODEM ESTAR BLOQUEANDO ACESSO
-- ============================================================================

-- Remover políticas baseadas em company_id (que não existe mais ou não deve restringir)
DROP POLICY IF EXISTS "Users can view cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can insert cars to their company" ON public.cars;
DROP POLICY IF EXISTS "Users can update cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can delete cars from their company" ON public.cars;

DROP POLICY IF EXISTS "Users can view customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers to their company" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers from their company" ON public.customers;

DROP POLICY IF EXISTS "Users can view reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert reservations to their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can update reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete reservations from their company" ON public.reservations;

DROP POLICY IF EXISTS "Users can view checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can insert checkouts to their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can update checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can delete checkouts from their company" ON public.checkouts;

DROP POLICY IF EXISTS "Users can view checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can insert checkins to their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can update checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can delete checkins from their company" ON public.checkins;

-- ============================================================================
-- GARANTIR QUE POLÍTICAS PERMISSIVAS ESTEJAM ATIVAS
-- ============================================================================

-- CARS - Todos os usuários autenticados podem ver/modificar
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
CREATE POLICY "Authenticated users can view cars" ON public.cars FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert cars" ON public.cars;
CREATE POLICY "Authenticated users can insert cars" ON public.cars FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update cars" ON public.cars;
CREATE POLICY "Authenticated users can update cars" ON public.cars FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete cars" ON public.cars;
CREATE POLICY "Authenticated users can delete cars" ON public.cars FOR DELETE TO authenticated USING (true);

-- CUSTOMERS - Todos os usuários autenticados podem ver/modificar
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- RESERVATIONS - Todos os usuários autenticados podem ver/modificar
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
CREATE POLICY "Authenticated users can view reservations" ON public.reservations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON public.reservations;
CREATE POLICY "Authenticated users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update reservations" ON public.reservations;
CREATE POLICY "Authenticated users can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON public.reservations;
CREATE POLICY "Authenticated users can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (true);

-- CHECKOUTS - Todos os usuários autenticados podem ver/modificar
DROP POLICY IF EXISTS "Authenticated users can view checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can view checkouts" ON public.checkouts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can insert checkouts" ON public.checkouts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can update checkouts" ON public.checkouts FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete checkouts" ON public.checkouts;
CREATE POLICY "Authenticated users can delete checkouts" ON public.checkouts FOR DELETE TO authenticated USING (true);

-- CHECKINS - Todos os usuários autenticados podem ver/modificar
DROP POLICY IF EXISTS "Authenticated users can view checkins" ON public.checkins;
CREATE POLICY "Authenticated users can view checkins" ON public.checkins FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert checkins" ON public.checkins;
CREATE POLICY "Authenticated users can insert checkins" ON public.checkins FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update checkins" ON public.checkins;
CREATE POLICY "Authenticated users can update checkins" ON public.checkins FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete checkins" ON public.checkins;
CREATE POLICY "Authenticated users can delete checkins" ON public.checkins FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- USER_PROFILES - Apenas usuários podem ver seu próprio perfil
-- Apenas admins/super_admins podem gerenciar outros funcionários
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON public.user_profiles;

-- Política para usuários verem seu próprio perfil
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- Política para usuários criarem seu próprio perfil
CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Política para super_admins verem todos os perfis (para gerenciar funcionários)
CREATE POLICY "Super admins can view all user profiles" 
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Política para super_admins atualizarem todos os perfis (para gerenciar funcionários)
CREATE POLICY "Super admins can update all user profiles" 
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- ============================================================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can view cars" ON public.cars IS 
'Todos os usuários autenticados podem ver carros. Apenas gerenciamento de funcionários é restrito.';

COMMENT ON POLICY "Users can view their own profile" ON public.user_profiles IS 
'Usuários podem ver apenas seu próprio perfil. Super admins podem ver todos através da política separada.';

COMMENT ON POLICY "Super admins can view all user profiles" ON public.user_profiles IS 
'Apenas super admins podem ver todos os perfis para gerenciar funcionários.';
