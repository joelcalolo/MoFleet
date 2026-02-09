-- Migration: Adicionar campos opcionais em user_profiles
-- Adiciona campos position e department (opcionais, podem ser usados para relatórios)

-- Adicionar campos opcionais
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.user_profiles.position IS 'Cargo do funcionário (ex: Mecânico, Gestor de Stock)';
COMMENT ON COLUMN public.user_profiles.department IS 'Departamento do funcionário (ex: Manutenção, Compras)';
