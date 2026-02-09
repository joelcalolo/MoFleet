-- Migration: Adicionar campos de inventário na tabela cars
-- Adiciona campos essenciais para gestão de inventário: year, chassis, current_mileage, status

-- Adicionar campos faltantes
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS chassis TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS current_mileage DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disponivel' 
    CHECK (status IN ('disponivel', 'em_manutencao', 'alugado', 'inativo'));

-- Comentários para documentação
COMMENT ON COLUMN public.cars.year IS 'Ano do veículo';
COMMENT ON COLUMN public.cars.chassis IS 'Número do chassis (único)';
COMMENT ON COLUMN public.cars.current_mileage IS 'Quilometragem atual do veículo';
COMMENT ON COLUMN public.cars.status IS 'Status do veículo: disponivel, em_manutencao, alugado, inativo';

-- Criar índice para chassis (já é UNIQUE, mas índice ajuda em buscas)
CREATE INDEX IF NOT EXISTS idx_cars_chassis ON public.cars(chassis);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
