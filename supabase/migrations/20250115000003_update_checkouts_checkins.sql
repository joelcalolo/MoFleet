-- Adicionar campos faltantes em checkouts
ALTER TABLE public.checkouts
  ADD COLUMN IF NOT EXISTS delivered_by TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Adicionar campos faltantes em checkins
ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS received_by TEXT,
  ADD COLUMN IF NOT EXISTS deposit_returned_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Atualizar políticas RLS para checkouts
DROP POLICY IF EXISTS "Authenticated users can view checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can insert checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can update checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can delete checkouts" ON public.checkouts;

CREATE POLICY "Users can view checkouts from their company" ON public.checkouts FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkouts to their company" ON public.checkouts FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkouts from their company" ON public.checkouts FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkouts from their company" ON public.checkouts FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Atualizar políticas RLS para checkins
DROP POLICY IF EXISTS "Authenticated users can view checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can insert checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can update checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can delete checkins" ON public.checkins;

CREATE POLICY "Users can view checkins from their company" ON public.checkins FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkins to their company" ON public.checkins FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkins from their company" ON public.checkins FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkins from their company" ON public.checkins FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

