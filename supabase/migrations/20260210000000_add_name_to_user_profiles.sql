-- Adicionar campo name em user_profiles para armazenar nome do funcionário
-- Permite identificar funcionários que criaram reservas, checkouts e checkins

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS name TEXT;

COMMENT ON COLUMN public.user_profiles.name IS 'Nome completo do funcionário (opcional, pode usar email se não preenchido)';

-- Criar função helper para buscar nome do funcionário
-- Retorna nome de user_profiles ou company_users baseado nos IDs
CREATE OR REPLACE FUNCTION public.get_employee_name(
  p_user_id UUID DEFAULT NULL,
  p_company_user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Se tiver user_id, buscar em user_profiles
  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(up.name, au.email)
    INTO v_name
    FROM public.user_profiles up
    LEFT JOIN auth.users au ON au.id = up.user_id
    WHERE up.user_id = p_user_id;
    
    IF v_name IS NOT NULL THEN
      RETURN v_name;
    END IF;
  END IF;
  
  -- Se tiver company_user_id, buscar em company_users
  IF p_company_user_id IS NOT NULL THEN
    SELECT username
    INTO v_name
    FROM public.company_users
    WHERE id = p_company_user_id;
    
    IF v_name IS NOT NULL THEN
      RETURN v_name;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$;
