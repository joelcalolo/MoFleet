-- Adicionar campos de auditoria nas tabelas principais
-- Campo para registrar qual usuário (auth.users) fez a ação
ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_company_user_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL;

ALTER TABLE public.checkouts 
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_company_user_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL;

ALTER TABLE public.checkins 
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_company_user_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_reservations_created_by_user ON public.reservations(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_by_company_user ON public.reservations(created_by_company_user_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_created_by_user ON public.checkouts(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_created_by_company_user ON public.checkouts(created_by_company_user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_created_by_user ON public.checkins(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_created_by_company_user ON public.checkins(created_by_company_user_id);

