-- Adicionar campos de controle de quilometragem na tabela cars
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS daily_km_limit INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS extra_km_price DECIMAL(10,2) DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.cars.daily_km_limit IS 'Plafond diário de quilometragem permitida (km/dia)';
COMMENT ON COLUMN public.cars.extra_km_price IS 'Preço por km extra quando excede o plafond (AKZ/km)';

