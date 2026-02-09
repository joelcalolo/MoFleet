-- Adicionar colunas opcionais para cor e prioridade nas categorias de peças
ALTER TABLE public.part_categories
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT;

COMMENT ON COLUMN public.part_categories.color IS 'Cor sugerida para UI (ex: #E74C3C)';
COMMENT ON COLUMN public.part_categories.priority IS 'Prioridade: Alta, Média, Baixa';
