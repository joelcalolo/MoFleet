-- Migration: Criar políticas RLS simplificadas para tabelas de inventário
-- Políticas simples: apenas verificar se usuário está autenticado

-- ============================================================================
-- POLÍTICAS RLS PARA suppliers
-- ============================================================================
CREATE POLICY "Authenticated users can view suppliers" 
  ON public.suppliers FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert suppliers" 
  ON public.suppliers FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers" 
  ON public.suppliers FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete suppliers" 
  ON public.suppliers FOR DELETE 
  TO authenticated 
  USING (true);

-- ============================================================================
-- POLÍTICAS RLS PARA part_categories
-- ============================================================================
CREATE POLICY "Authenticated users can view part_categories" 
  ON public.part_categories FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert part_categories" 
  ON public.part_categories FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update part_categories" 
  ON public.part_categories FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete part_categories" 
  ON public.part_categories FOR DELETE 
  TO authenticated 
  USING (true);

-- ============================================================================
-- POLÍTICAS RLS PARA parts
-- ============================================================================
CREATE POLICY "Authenticated users can view parts" 
  ON public.parts FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert parts" 
  ON public.parts FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update parts" 
  ON public.parts FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete parts" 
  ON public.parts FOR DELETE 
  TO authenticated 
  USING (true);

-- ============================================================================
-- POLÍTICAS RLS PARA stock_entries
-- ============================================================================
CREATE POLICY "Authenticated users can view stock_entries" 
  ON public.stock_entries FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert stock_entries" 
  ON public.stock_entries FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock_entries" 
  ON public.stock_entries FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete stock_entries" 
  ON public.stock_entries FOR DELETE 
  TO authenticated 
  USING (true);

-- ============================================================================
-- POLÍTICAS RLS PARA stock_exits
-- ============================================================================
CREATE POLICY "Authenticated users can view stock_exits" 
  ON public.stock_exits FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert stock_exits" 
  ON public.stock_exits FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock_exits" 
  ON public.stock_exits FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete stock_exits" 
  ON public.stock_exits FOR DELETE 
  TO authenticated 
  USING (true);

-- ============================================================================
-- POLÍTICAS RLS PARA stock_adjustments
-- ============================================================================
CREATE POLICY "Authenticated users can view stock_adjustments" 
  ON public.stock_adjustments FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert stock_adjustments" 
  ON public.stock_adjustments FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock_adjustments" 
  ON public.stock_adjustments FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete stock_adjustments" 
  ON public.stock_adjustments FOR DELETE 
  TO authenticated 
  USING (true);
