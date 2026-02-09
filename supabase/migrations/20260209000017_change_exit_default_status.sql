-- Alterar status padrão de saídas de 'pending' para 'delivered'
-- Isso faz com que novas saídas sejam automaticamente entregues e reduzam o stock imediatamente

ALTER TABLE public.stock_exits
  ALTER COLUMN status SET DEFAULT 'delivered';

COMMENT ON COLUMN public.stock_exits.status IS 'Status da saída: pending (pendente), delivered (entregue - reduz stock), cancelled (cancelado)';
