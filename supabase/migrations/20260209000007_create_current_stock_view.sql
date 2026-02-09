-- Migration: Criar VIEW current_stock para calcular stock atual
-- VIEW que calcula stock atual baseado em entradas, saídas entregues e ajustes aplicados

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
LEFT JOIN public.stock_entries e ON p.id = e.part_id
LEFT JOIN public.stock_exits ex ON p.id = ex.part_id
LEFT JOIN public.stock_adjustments adj ON p.id = adj.part_id
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
  p.is_active;

-- Comentário para documentação
COMMENT ON VIEW public.current_stock IS 'VIEW que calcula stock atual de todas as peças baseado em entradas, saídas entregues e ajustes aplicados';

-- Permitir acesso à VIEW para usuários autenticados
GRANT SELECT ON public.current_stock TO authenticated;
