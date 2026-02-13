-- Restaurar criação de company e user_profile no signup (removido em 20260209000000_remove_multi_tenant).
-- Novos utilizadores passam a ter sempre uma linha em user_profiles e uma company associada.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
BEGIN
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa');

  INSERT INTO public.companies (name, email)
  VALUES (company_name, NEW.email)
  RETURNING id INTO new_company_id;

  INSERT INTO public.user_profiles (user_id, company_id, role, is_active)
  VALUES (NEW.id, new_company_id, 'owner', true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Cria company e user_profile para cada novo utilizador (auth.users). Restaurado após remove_multi_tenant.';
