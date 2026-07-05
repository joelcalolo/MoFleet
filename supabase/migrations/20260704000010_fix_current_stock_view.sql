-- Migration: Fix current_stock view to filter by company_id
-- This ensures that users can only see stock from their own company

-- Drop the old view
DROP VIEW IF EXISTS public.current_stock;

-- Create the new view with company_id filtering
CREATE OR REPLACE VIEW public.current_stock AS
SELECT 
  p.id AS part_id,
  p.code AS part_code,
  p.name AS part_name,
  pc.name AS category_name,
  pc.code AS category_code,
  p.unit,
  p.min_stock,
  p.warehouse_location,
  p.average_price,
  p.is_active,
  p.company_id,
  
  -- Calcular stock atual
  COALESCE(SUM(e.quantity), 0) - 
  COALESCE(SUM(CASE WHEN ex.status = 'delivered' THEN ex.quantity ELSE 0 END), 0) +
  COALESCE(SUM(CASE WHEN adj.status = 'applied' THEN adj.difference ELSE 0 END), 0) AS current_stock,
  
  -- Totais para referência
  COALESCE(SUM(e.quantity), 0) AS total_entries,
  COALESCE(SUM(CASE WHEN ex.status = 'delivered' THEN ex.quantity ELSE 0 END), 0) AS total_exits_delivered,
  COALESCE(SUM(CASE WHEN adj.status = 'applied' THEN adj.difference ELSE 0 END), 0) AS total_adjustments_applied,
  
  -- Status do stock baseado em min_stock
  CASE 
    WHEN (COALESCE(SUM(e.quantity), 0) - 
          COALESCE(SUM(CASE WHEN ex.status = 'delivered' THEN ex.quantity ELSE 0 END), 0) +
          COALESCE(SUM(CASE WHEN adj.status = 'applied' THEN adj.difference ELSE 0 END), 0)) <= 0 
      THEN 'ESGOTADO'
    WHEN p.min_stock > 0 AND 
         (COALESCE(SUM(e.quantity), 0) - 
          COALESCE(SUM(CASE WHEN ex.status = 'delivered' THEN ex.quantity ELSE 0 END), 0) +
          COALESCE(SUM(CASE WHEN adj.status = 'applied' THEN adj.difference ELSE 0 END), 0)) < p.min_stock 
      THEN 'CRITICO'
    WHEN p.min_stock > 0 AND 
         (COALESCE(SUM(e.quantity), 0) - 
          COALESCE(SUM(CASE WHEN ex.status = 'delivered' THEN ex.quantity ELSE 0 END), 0) +
          COALESCE(SUM(CASE WHEN adj.status = 'applied' THEN adj.difference ELSE 0 END), 0)) <= (p.min_stock * 1.5)
      THEN 'BAIXO'
    ELSE 'OK'
  END AS status_stock,
  
  -- Últimas movimentações
  MAX(e.entry_date) AS last_entry_date,
  MAX(CASE WHEN ex.status = 'delivered' THEN ex.exit_date END) AS last_exit_date,
  MAX(CASE WHEN adj.status = 'applied' THEN adj.adjustment_date END) AS last_adjustment_date,
  
  -- Valor total em stock
  (COALESCE(SUM(e.quantity), 0) - 
   COALESCE(SUM(CASE WHEN ex.status = 'delivered' THEN ex.quantity ELSE 0 END), 0) +
   COALESCE(SUM(CASE WHEN adj.status = 'applied' THEN adj.difference ELSE 0 END), 0)) * p.average_price AS total_value

FROM public.parts p
LEFT JOIN public.part_categories pc ON p.category_id = pc.id
LEFT JOIN public.stock_entries e ON p.id = e.part_id AND e.company_id = p.company_id
LEFT JOIN public.stock_exits ex ON p.id = ex.part_id AND ex.company_id = p.company_id
LEFT JOIN public.stock_adjustments adj ON p.id = adj.part_id AND adj.company_id = p.company_id
WHERE p.is_active = true
GROUP BY 
  p.id, 
  p.code, 
  p.name, 
  pc.name, 
  pc.code,
  p.unit,
  p.min_stock,
  p.warehouse_location,
  p.average_price,
  p.is_active,
  p.company_id;

-- Comentário para documentação
COMMENT ON VIEW public.current_stock IS 'VIEW que calcula stock atual de todas as peças baseado em entradas, saídas entregues e ajustes aplicados. Filtra por company_id para isolamento multi-tenant.';

-- Permitir acesso à VIEW para usuários autenticados
GRANT SELECT ON public.current_stock TO authenticated;

-- Criar função RPC para filtrar current_stock por company_id do usuário
CREATE OR REPLACE FUNCTION public.get_current_stock()
RETURNS TABLE (
  part_id UUID,
  part_code TEXT,
  part_name TEXT,
  category_name TEXT,
  category_code TEXT,
  unit TEXT,
  min_stock DECIMAL(10,2),
  warehouse_location TEXT,
  average_price DECIMAL(10,2),
  is_active BOOLEAN,
  company_id UUID,
  current_stock DECIMAL(10,2),
  total_entries DECIMAL(10,2),
  total_exits_delivered DECIMAL(10,2),
  total_adjustments_applied DECIMAL(10,2),
  status_stock TEXT,
  last_entry_date TIMESTAMPTZ,
  last_exit_date TIMESTAMPTZ,
  last_adjustment_date TIMESTAMPTZ,
  total_value DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_company_id UUID;
BEGIN
  -- Obter company_id do usuário
  SELECT company_id INTO caller_company_id 
  FROM public.user_profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Se não tiver company_id, retornar vazio
  IF caller_company_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Retornar stock apenas da empresa do usuário
  RETURN QUERY
  SELECT 
    cs.part_id,
    cs.part_code,
    cs.part_name,
    cs.category_name,
    cs.category_code,
    cs.unit,
    cs.min_stock,
    cs.warehouse_location,
    cs.average_price,
    cs.is_active,
    cs.company_id,
    cs.current_stock,
    cs.total_entries,
    cs.total_exits_delivered,
    cs.total_adjustments_applied,
    cs.status_stock,
    cs.last_entry_date,
    cs.last_exit_date,
    cs.last_adjustment_date,
    cs.total_value
  FROM public.current_stock cs
  WHERE cs.company_id = caller_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_stock() TO authenticated;

COMMENT ON FUNCTION public.get_current_stock() IS 'Retorna stock atual filtrado por company_id do usuário para isolamento multi-tenant.';
