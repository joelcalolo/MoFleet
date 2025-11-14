-- Atualizar políticas para permitir apenas super_admins gerenciarem company_users
DROP POLICY IF EXISTS "Owners and admins can create company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can update company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can delete company users" ON public.company_users;

-- Super admins podem criar company_users em qualquer empresa
CREATE POLICY "Super admins can create company users" 
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

-- Super admins podem atualizar company_users em qualquer empresa
CREATE POLICY "Super admins can update company users" 
  ON public.company_users FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- Super admins podem deletar company_users em qualquer empresa
CREATE POLICY "Super admins can delete company users" 
  ON public.company_users FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- Super admins podem ver todos os company_users
CREATE POLICY "Super admins can view all company users" 
  ON public.company_users FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Nota: A política "Users can view company users from their company" já existe
-- na migration 20250116000002_create_company_users.sql e não precisa ser recriada

