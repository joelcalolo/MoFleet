-- Índices de performance focados em company_id e padrões de consulta mais usados

-- Tabela cars: acesso sempre por company_id
CREATE INDEX IF NOT EXISTS idx_cars_company_id
  ON public.cars (company_id);

-- Tabela customers: acesso sempre por company_id
CREATE INDEX IF NOT EXISTS idx_customers_company_id
  ON public.customers (company_id);

-- Tabela reservations: acesso por company_id e status/data
CREATE INDEX IF NOT EXISTS idx_reservations_company_id
  ON public.reservations (company_id);

CREATE INDEX IF NOT EXISTS idx_reservations_company_status_start_date
  ON public.reservations (company_id, status, start_date);

-- Tabela checkouts: acesso por company_id e reserva
CREATE INDEX IF NOT EXISTS idx_checkouts_company_id
  ON public.checkouts (company_id);

CREATE INDEX IF NOT EXISTS idx_checkouts_reservation_id
  ON public.checkouts (reservation_id);

-- Tabela checkins: acesso por company_id e reserva
CREATE INDEX IF NOT EXISTS idx_checkins_company_id
  ON public.checkins (company_id);

CREATE INDEX IF NOT EXISTS idx_checkins_reservation_id
  ON public.checkins (reservation_id);

