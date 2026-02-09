-- Seed: Inserir peças existentes no inventário
-- Usa CTE para buscar category_id e supplier_id pelos códigos

WITH category_map AS (
  SELECT code, id FROM public.part_categories
),
supplier_map AS (
  SELECT code, id FROM public.suppliers
),
parts_data AS (
  SELECT * FROM (VALUES
    -- TRAVÕES
    ('TRV-PRADO-001', 'Calço de travão dianteiro', 'TRV', 'Toyota Prado TXL', 'conj', 1, 29951.99, 'FOR001'),
    ('TRV-LC-001', 'Calço de travão dianteiro', 'TRV', 'Toyota Land Cruiser VX 5.7', 'conj', 1, 29951.99, 'FOR001'),
    ('TRV-MAZDA-001', 'Calço de travão dianteiro', 'TRV', 'Mazda CX-V6', 'conj', 1, 33947.85, 'FOR001'),
    ('TRV-V8P-001', 'Calço de travão dianteiro', 'TRV', 'Toyota Land Cruiser VX 5.7', 'conj', 1, NULL, NULL),
    ('TRV-V8P-002', 'Calço de travão traseiro', 'TRV', 'Toyota Land Cruiser VX 5.7', 'conj', 1, NULL, NULL),
    ('TRV-JIMNY-001', 'Calço de travão dianteiro', 'TRV', 'Suzuki Jimny', 'conj', 1, NULL, NULL),
    ('TRV-DZIRE-001', 'Calço de travão dianteiro', 'TRV', 'Suzuki Dzire', 'conj', 1, NULL, NULL),
    ('TRV-SWIFT-001', 'Calço de travão dianteiro', 'TRV', 'Genérico', 'conj', 2, NULL, NULL),
    ('TRV-LEXUS-001', 'Calço de travão dianteiro', 'TRV', 'Lexus LX 570 S', 'conj', 1, NULL, NULL),
    ('TRV-GERAL-001', 'Calço de travão', 'TRV', 'Genérico', 'conj', 1, NULL, NULL),
    
    -- MOTOR
    ('MOT-PRADO-001', 'Correia de distribuição', 'MOT', 'Toyota Prado TXL', 'un', 1, 29951.99, 'FOR001'),
    ('MOT-MAZDA-001', 'Correia do alternador', 'MOT', 'Mazda CX-V6', 'un', 1, 9827.25, 'FOR001'),
    ('MOT-PAJERO-001', 'Correia de distribuição', 'MOT', 'Mitsubishi Pajero GLS - V6', 'un', 1, 28038.78, 'FOR001'),
    ('MOT-HZ-001', 'Correia do alternador', 'MOT', 'Toyota Land Cruiser HZ', 'un', 2, 6841.75, 'FOR001'),
    ('MOT-HZ-002', 'Correia auxiliar', 'MOT', 'Toyota Land Cruiser HZ', 'un', 1, 11040.13, 'FOR001'),
    ('MOT-JIMNY-001', 'Correia do alternador', 'MOT', 'Suzuki Jimny', 'un', 1, 9982.75, 'FOR001'),
    ('MOT-SWIFT-001', 'Correia do alternador', 'MOT', 'Genérico', 'un', 1, 9143.05, 'FOR001'),
    ('MOT-I20-001', 'Correia do alternador', 'MOT', 'Hyundai i20 1.2', 'un', 1, 13882.56, 'FOR001'),
    ('MOT-V8P-001', 'Correia de distribuição', 'MOT', 'Toyota Land Cruiser VX 5.7', 'un', 1, NULL, NULL),
    ('MOT-LEXUS-001', 'Correia de distribuição', 'MOT', 'Lexus LX 570 S', 'un', 1, NULL, NULL),
    ('MOT-PRADO-002', 'Correia auxiliar', 'MOT', 'Toyota GX Luanda da sorte', 'un', 1, NULL, NULL),
    ('MOT-PRADO-003', 'Jogo de velas de ignição', 'MOT', 'Toyota Prado TXL', 'jogo', 2, NULL, NULL),
    
    -- ELÉTRICO
    ('ELE-PRADO-001', 'Conjunto acessórios ignição', 'ELE', 'Toyota GX Luanda da sorte', 'conj', 1, NULL, NULL),
    ('ELE-GERAL-001', 'Lâmpada de farol H12', 'ELE', 'Geral', 'un', 1, NULL, NULL),
    ('ELE-PRADO-002', 'Bateria', 'ELE', 'Toyota Prado TXL', 'un', 2, NULL, NULL),
    ('ELE-LEXUS-001', 'Bateria', 'ELE', 'Lexus LX 570 S', 'un', 1, NULL, NULL),
    ('ELE-GERAL-002', 'Lâmpada tipo chupetinha', 'ELE', 'Geral', 'un', 1, NULL, NULL),
    ('ELE-GERAL-003', 'Lâmpada de 1 polo', 'ELE', 'Geral', 'un', 2, NULL, NULL),
    ('ELE-GERAL-004', 'Lâmpada de 2 polos', 'ELE', 'Geral', 'un', 3, NULL, NULL),
    ('ELE-FORT-001', 'Lâmpada tipo águia', 'ELE', 'Toyota Fortuner', 'un', 1, NULL, NULL),
    
    -- FILTROS
    ('FIL-GERAL-001', 'Filtro de ar', 'FIL', 'Vários modelos', 'un', 3, NULL, NULL),
    ('FIL-GERAL-002', 'Filtro de ar condicionado', 'FIL', 'Vários modelos', 'un', 4, NULL, NULL),
    
    -- LUBRIFICANTES
    ('LUB-GAS-001', 'Óleo de motor 15W40', 'LUB', 'Motores gasolina', 'L', 1, NULL, NULL),
    ('LUB-DIE-001', 'Óleo de motor 15W40', 'LUB', 'Motores diesel', 'L', 1, NULL, NULL),
    ('LUB-GERAL-001', 'Óleo hidráulico avulso', 'LUB', 'Geral', 'L', 1, NULL, NULL),
    ('LUB-GERAL-002', 'Óleo hidráulico selado', 'LUB', 'Geral', 'L', 1, NULL, NULL),
    
    -- QUÍMICOS
    ('QUI-GERAL-001', 'Penetrol', 'QUI', 'Geral', 'un', 1, NULL, NULL),
    ('QUI-GERAL-002', 'Limpa contacto', 'QUI', 'Geral', 'un', 1, NULL, NULL),
    
    -- CONSUMÍVEIS
    ('CON-GERAL-001', 'Fita isoladora', 'CON', 'Geral', 'rolo', 1, NULL, NULL),
    
    -- ADMINISTRATIVO
    ('ADM-GERAL-001', 'Selo de revisão', 'ADM', 'Geral', 'un', 33, NULL, NULL),
    
    -- OUTROS
    ('OUT-PRADO-001', 'Metade da chave', 'OUT', 'Toyota GX Luanda da sorte', 'un', 1, NULL, NULL)
  ) AS t(code, name, category_code, car_model, unit, stock_qty, price, supplier_code)
)
INSERT INTO public.parts (code, name, category_id, car_model_reference, unit, average_price, is_active)
SELECT 
  p.code,
  p.name,
  cm.id AS category_id,
  p.car_model AS car_model_reference,
  p.unit,
  COALESCE(p.price, 0) AS average_price,
  true AS is_active
FROM parts_data p
JOIN category_map cm ON cm.code = p.category_code
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  car_model_reference = EXCLUDED.car_model_reference,
  unit = EXCLUDED.unit,
  average_price = EXCLUDED.average_price,
  updated_at = now();

-- Criar stock_entries iniciais para peças com quantidade em stock
-- Nota: Requer que exista pelo menos um usuário autenticado (purchased_by é NOT NULL)
-- Se não houver usuários, estas entradas não serão criadas
WITH parts_with_stock AS (
  SELECT * FROM (VALUES
    ('TRV-PRADO-001', 1, 29951.99, 'FORN001'),
    ('TRV-LC-001', 1, 29951.99, 'FORN001'),
    ('TRV-MAZDA-001', 1, 33947.85, 'FORN001'),
    ('TRV-V8P-001', 1, NULL, NULL),
    ('TRV-V8P-002', 1, NULL, NULL),
    ('TRV-JIMNY-001', 1, NULL, NULL),
    ('TRV-DZIRE-001', 1, NULL, NULL),
    ('TRV-SWIFT-001', 2, NULL, NULL),
    ('TRV-LEXUS-001', 1, NULL, NULL),
    ('TRV-GERAL-001', 1, NULL, NULL),
    ('MOT-PRADO-001', 1, 29951.99, 'FORN001'),
    ('MOT-MAZDA-001', 1, 9827.25, 'FORN001'),
    ('MOT-PAJERO-001', 1, 28038.78, 'FORN001'),
    ('MOT-HZ-001', 2, 6841.75, 'FORN001'),
    ('MOT-HZ-002', 1, 11040.13, 'FORN001'),
    ('MOT-JIMNY-001', 1, 9982.75, 'FORN001'),
    ('MOT-SWIFT-001', 1, 9143.05, 'FORN001'),
    ('MOT-I20-001', 1, 13882.56, 'FORN001'),
    ('MOT-V8P-001', 1, NULL, NULL),
    ('MOT-LEXUS-001', 1, NULL, NULL),
    ('MOT-PRADO-002', 1, NULL, NULL),
    ('MOT-PRADO-003', 2, NULL, NULL),
    ('ELE-PRADO-001', 1, NULL, NULL),
    ('ELE-GERAL-001', 1, NULL, NULL),
    ('ELE-PRADO-002', 2, NULL, NULL),
    ('ELE-LEXUS-001', 1, NULL, NULL),
    ('ELE-GERAL-002', 1, NULL, NULL),
    ('ELE-GERAL-003', 2, NULL, NULL),
    ('ELE-GERAL-004', 3, NULL, NULL),
    ('ELE-FORT-001', 1, NULL, NULL),
    ('FIL-GERAL-001', 3, NULL, NULL),
    ('FIL-GERAL-002', 4, NULL, NULL),
    ('LUB-GAS-001', 1, NULL, NULL),
    ('LUB-DIE-001', 1, NULL, NULL),
    ('LUB-GERAL-001', 1, NULL, NULL),
    ('LUB-GERAL-002', 1, NULL, NULL),
    ('QUI-GERAL-001', 1, NULL, NULL),
    ('QUI-GERAL-002', 1, NULL, NULL),
    ('CON-GERAL-001', 1, NULL, NULL),
    ('ADM-GERAL-001', 33, NULL, NULL),
    ('OUT-PRADO-001', 1, NULL, NULL)
  ) AS t(part_code, quantity, unit_price, supplier_code)
),
part_map AS (
  SELECT code, id FROM public.parts
),
supplier_map AS (
  SELECT code, id FROM public.suppliers
),
first_admin_user AS (
  SELECT id FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
)
INSERT INTO public.stock_entries (
  entry_number,
  entry_date,
  supplier_id,
  part_id,
  quantity,
  unit_price,
  purchased_by,
  purchased_by_name,
  notes
)
SELECT 
  'ENT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY p.part_code)::TEXT, 4, '0') AS entry_number,
  CURRENT_DATE AS entry_date,
  -- Usa o fornecedor específico se fornecido, senão usa o fornecedor genérico FOR000
  COALESCE(
    sm.id, -- Fornecedor específico da peça (FOR001, etc.)
    (SELECT id FROM supplier_map WHERE code = 'FOR000') -- Fornecedor genérico para peças sem fornecedor
  ) AS supplier_id,
  pm.id AS part_id,
  p.quantity,
  COALESCE(p.unit_price, 0) AS unit_price,
  COALESCE((SELECT id FROM first_admin_user), (SELECT id FROM auth.users LIMIT 1)) AS purchased_by,
  'Importação inicial' AS purchased_by_name,
  'Stock inicial - importação de dados' AS notes
FROM parts_with_stock p
JOIN part_map pm ON pm.code = p.part_code
LEFT JOIN supplier_map sm ON sm.code = p.supplier_code -- Só faz JOIN se tiver fornecedor específico
WHERE p.quantity > 0
  AND EXISTS (SELECT 1 FROM auth.users LIMIT 1) -- Só cria se houver pelo menos um usuário
  AND EXISTS (SELECT 1 FROM supplier_map WHERE code = 'FOR000') -- Garante que o fornecedor genérico existe
ON CONFLICT (entry_number) DO NOTHING;
