-- Atualizar saída específica de "pending" para "delivered"
-- Isso fará com que o stock seja reduzido

UPDATE public.stock_exits
SET 
  status = 'delivered',
  updated_at = now()
WHERE id = '69203688-0be2-4389-aba1-4fff0d6a3947'
  AND status = 'pending';

-- Verificar se foi atualizado
SELECT 
  exit_number,
  part_id,
  quantity,
  status,
  updated_at
FROM public.stock_exits
WHERE id = '69203688-0be2-4389-aba1-4fff0d6a3947';
