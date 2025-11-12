-- Corrigir políticas RLS para checkouts
-- Permitir inserção mesmo se company_id for NULL (para compatibilidade)
-- e verificar através da reserva associada

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can insert checkouts to their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can update checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can delete checkouts from their company" ON public.checkouts;

-- Nova política para SELECT: verificar através de company_id ou através da reserva
CREATE POLICY "Users can view checkouts from their company" ON public.checkouts FOR SELECT TO authenticated 
  USING (
    -- Se tem company_id, verificar se pertence à empresa do usuário
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    ))
    OR
    -- Se não tem company_id, verificar através da reserva
    (company_id IS NULL AND reservation_id IN (
      SELECT r.id FROM public.reservations r
      INNER JOIN public.user_profiles up ON r.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    ))
  );

-- Nova política para INSERT: permitir se company_id corresponde ou se a reserva pertence à empresa
CREATE POLICY "Users can insert checkouts to their company" ON public.checkouts FOR INSERT TO authenticated 
  WITH CHECK (
    -- Se tem company_id, verificar se pertence à empresa do usuário
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    ))
    OR
    -- Se não tem company_id, verificar através da reserva
    (company_id IS NULL AND reservation_id IN (
      SELECT r.id FROM public.reservations r
      INNER JOIN public.user_profiles up ON r.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    ))
  );

-- Nova política para UPDATE
CREATE POLICY "Users can update checkouts from their company" ON public.checkouts FOR UPDATE TO authenticated 
  USING (
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    ))
    OR
    (company_id IS NULL AND reservation_id IN (
      SELECT r.id FROM public.reservations r
      INNER JOIN public.user_profiles up ON r.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    ))
  );

-- Nova política para DELETE
CREATE POLICY "Users can delete checkouts from their company" ON public.checkouts FOR DELETE TO authenticated 
  USING (
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    ))
    OR
    (company_id IS NULL AND reservation_id IN (
      SELECT r.id FROM public.reservations r
      INNER JOIN public.user_profiles up ON r.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    ))
  );

