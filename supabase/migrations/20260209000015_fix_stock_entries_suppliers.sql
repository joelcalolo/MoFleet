-- Corrigir fornecedores nas stock_entries criadas incorretamente
-- Apenas peças com fornecedor específico (FOR001) devem ter GondoÁfrica
-- Todas as outras devem usar o fornecedor genérico (FOR000)

-- Primeiro, garantir que o fornecedor genérico existe
INSERT INTO public.suppliers (code, name, is_active)
VALUES ('FOR000', 'Sem Fornecedor', true)
ON CONFLICT (code) DO NOTHING;

-- Lista de códigos de peças que devem ter FOR001 (GondoÁfrica)
WITH parts_with_supplier AS (
  SELECT UNNEST(ARRAY[
    'TRV-PRADO-001',
    'TRV-LC-001',
    'TRV-MAZDA-001',
    'MOT-PRADO-001',
    'MOT-MAZDA-001',
    'MOT-PAJERO-001',
    'MOT-HZ-001',
    'MOT-HZ-002',
    'MOT-JIMNY-001',
    'MOT-SWIFT-001',
    'MOT-I20-001'
  ]) AS part_code
),
supplier_map AS (
  SELECT code, id FROM public.suppliers
),
correct_suppliers AS (
  SELECT 
    se.id AS entry_id,
    p.code AS part_code,
    CASE 
      WHEN EXISTS (SELECT 1 FROM parts_with_supplier WHERE part_code = p.code)
      THEN (SELECT id FROM supplier_map WHERE code = 'FOR001') -- GondoÁfrica
      ELSE (SELECT id FROM supplier_map WHERE code = 'FOR000') -- Sem Fornecedor
    END AS correct_supplier_id
  FROM public.stock_entries se
  JOIN public.parts p ON se.part_id = p.id
)
UPDATE public.stock_entries se
SET supplier_id = cs.correct_supplier_id
FROM correct_suppliers cs
WHERE se.id = cs.entry_id
  AND se.supplier_id != cs.correct_supplier_id; -- Só atualiza se for diferente
