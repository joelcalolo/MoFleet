-- Migration: Fix calculate_current_stock function to filter by company_id
-- This ensures that stock calculations only consider data from the same company

DROP FUNCTION IF EXISTS public.calculate_current_stock(UUID);

CREATE OR REPLACE FUNCTION public.calculate_current_stock(p_part_id UUID, p_company_id UUID DEFAULT NULL)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  total_entries DECIMAL(10,2);
  total_exits DECIMAL(10,2);
  total_adjustments DECIMAL(10,2);
  current_stock DECIMAL(10,2);
  part_company_id UUID;
BEGIN
  -- Obter company_id da peça
  SELECT company_id INTO part_company_id
  FROM public.parts
  WHERE id = p_part_id
  LIMIT 1;
  
  -- Se não fornecido company_id, usar o da peça
  IF p_company_id IS NULL THEN
    p_company_id := part_company_id;
  END IF;
  
  -- Total de entradas (filtrado por company_id)
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_entries
  FROM public.stock_entries
  WHERE part_id = p_part_id
    AND company_id = p_company_id;
  
  -- Total de saídas entregues (filtrado por company_id)
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_exits
  FROM public.stock_exits
  WHERE part_id = p_part_id
    AND status = 'delivered'
    AND company_id = p_company_id;
  
  -- Total de ajustes aplicados (filtrado por company_id)
  SELECT COALESCE(SUM(difference), 0)
  INTO total_adjustments
  FROM public.stock_adjustments
  WHERE part_id = p_part_id
    AND status = 'applied'
    AND company_id = p_company_id;
  
  -- Calcular stock atual
  current_stock := total_entries - total_exits + total_adjustments;
  
  RETURN COALESCE(current_stock, 0);
END;
$$;

COMMENT ON FUNCTION public.calculate_current_stock(UUID, UUID) IS 'Calcula stock atual de uma peça baseado em entradas, saídas entregues e ajustes aplicados. Filtra por company_id para isolamento multi-tenant.';
