-- Adicionar campo para nome do motorista em checkouts
ALTER TABLE public.checkouts
  ADD COLUMN IF NOT EXISTS driver_name TEXT;

