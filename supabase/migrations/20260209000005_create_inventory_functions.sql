-- Migration: Criar funções auxiliares para o sistema de inventário
-- Funções para gerar números sequenciais e calcular stock atual

-- ============================================================================
-- FUNÇÃO 1: Gerar número sequencial para entradas (ENT-YYYY-NNNN)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year TEXT;
  last_number INTEGER;
  new_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Buscar último número do ano atual (formato: ENT-YYYY-NNNN)
  SELECT COALESCE(MAX(CAST(SPLIT_PART(entry_number, '-', 3) AS INTEGER)), 0)
  INTO last_number
  FROM public.stock_entries
  WHERE entry_number LIKE 'ENT-' || current_year || '-%';
  
  -- Incrementar e formatar
  new_number := 'ENT-' || current_year || '-' || LPAD((last_number + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- ============================================================================
-- FUNÇÃO 2: Gerar número sequencial para saídas (SAI-YYYY-NNNN)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_exit_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year TEXT;
  last_number INTEGER;
  new_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Buscar último número do ano atual (formato: SAI-YYYY-NNNN)
  SELECT COALESCE(MAX(CAST(SPLIT_PART(exit_number, '-', 3) AS INTEGER)), 0)
  INTO last_number
  FROM public.stock_exits
  WHERE exit_number LIKE 'SAI-' || current_year || '-%';
  
  -- Incrementar e formatar
  new_number := 'SAI-' || current_year || '-' || LPAD((last_number + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- ============================================================================
-- FUNÇÃO 3: Gerar número sequencial para ajustes (AJU-YYYY-NNNN)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_adjustment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year TEXT;
  last_number INTEGER;
  new_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Buscar último número do ano atual (formato: AJU-YYYY-NNNN)
  SELECT COALESCE(MAX(CAST(SPLIT_PART(adjustment_number, '-', 3) AS INTEGER)), 0)
  INTO last_number
  FROM public.stock_adjustments
  WHERE adjustment_number LIKE 'AJU-' || current_year || '-%';
  
  -- Incrementar e formatar
  new_number := 'AJU-' || current_year || '-' || LPAD((last_number + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- ============================================================================
-- FUNÇÃO 4: Calcular stock atual de uma peça
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_current_stock(p_part_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  total_entries DECIMAL(10,2);
  total_exits DECIMAL(10,2);
  total_adjustments DECIMAL(10,2);
  current_stock DECIMAL(10,2);
BEGIN
  -- Total de entradas
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_entries
  FROM public.stock_entries
  WHERE part_id = p_part_id;
  
  -- Total de saídas entregues
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_exits
  FROM public.stock_exits
  WHERE part_id = p_part_id
    AND status = 'delivered';
  
  -- Total de ajustes aplicados
  SELECT COALESCE(SUM(difference), 0)
  INTO total_adjustments
  FROM public.stock_adjustments
  WHERE part_id = p_part_id
    AND status = 'applied';
  
  -- Calcular stock atual
  current_stock := total_entries - total_exits + total_adjustments;
  
  RETURN COALESCE(current_stock, 0);
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION public.generate_entry_number() IS 'Gera número sequencial para entradas (ex: ENT-2026-0001)';
COMMENT ON FUNCTION public.generate_exit_number() IS 'Gera número sequencial para saídas (ex: SAI-2026-0001)';
COMMENT ON FUNCTION public.generate_adjustment_number() IS 'Gera número sequencial para ajustes (ex: AJU-2026-0001)';
COMMENT ON FUNCTION public.calculate_current_stock(UUID) IS 'Calcula stock atual de uma peça baseado em entradas, saídas entregues e ajustes aplicados';
