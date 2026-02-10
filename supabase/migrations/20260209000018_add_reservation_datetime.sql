-- Alterar reservas para armazenar data e hora de início/fim
-- Objetivo: permitir cálculo de diárias com base em janelas reais de 24h

BEGIN;

-- Converter colunas de DATE para TIMESTAMP WITH TIME ZONE
ALTER TABLE public.reservations
  ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::timestamptz,
  ALTER COLUMN end_date   TYPE TIMESTAMP WITH TIME ZONE USING end_date::timestamptz;

-- Índices existentes continuarão funcionando após a mudança de tipo.
-- A trigger de sobreposição (check_reservation_overlap) também continua válida,
-- pois a lógica de comparação de intervalos funciona igualmente para TIMESTAMPTZ.

COMMIT;

