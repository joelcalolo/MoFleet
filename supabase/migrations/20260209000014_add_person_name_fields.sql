-- Adicionar campos para registrar nome da pessoa que realizou a ação
-- Útil quando quem fez a ação não é necessariamente um usuário do sistema

-- Em stock_entries: quem recebeu/comprou
ALTER TABLE public.stock_entries
  ADD COLUMN IF NOT EXISTS purchased_by_name TEXT;

COMMENT ON COLUMN public.stock_entries.purchased_by IS 'ID do usuário que registrou no sistema';
COMMENT ON COLUMN public.stock_entries.purchased_by_name IS 'Nome da pessoa que recebeu/comprou a peça (pode não ser usuário do sistema)';

-- Em stock_exits: quem requisitou e quem entregou
ALTER TABLE public.stock_exits
  ADD COLUMN IF NOT EXISTS requested_by_name TEXT,
  ADD COLUMN IF NOT EXISTS delivered_by_name TEXT;

COMMENT ON COLUMN public.stock_exits.requested_by IS 'ID do usuário que registrou a requisição no sistema';
COMMENT ON COLUMN public.stock_exits.requested_by_name IS 'Nome da pessoa que requisitou a peça (pode não ser usuário do sistema)';
COMMENT ON COLUMN public.stock_exits.delivered_by IS 'ID do usuário que registrou a entrega no sistema';
COMMENT ON COLUMN public.stock_exits.delivered_by_name IS 'Nome da pessoa que entregou/retirou a peça (pode não ser usuário do sistema)';

-- Tornar os campos UUID opcionais (remover NOT NULL) para permitir registros sem usuário
ALTER TABLE public.stock_entries
  ALTER COLUMN purchased_by DROP NOT NULL;

ALTER TABLE public.stock_exits
  ALTER COLUMN requested_by DROP NOT NULL,
  ALTER COLUMN delivered_by DROP NOT NULL;
