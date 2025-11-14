-- Criar tabela de usuários da empresa (não precisam de email)
CREATE TABLE public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('gerente', 'tecnico')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, username)
);

-- Índices para melhor performance
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX idx_company_users_username ON public.company_users(username);

-- Habilitar RLS
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para company_users
-- Usuários podem ver usuários da sua empresa (se forem owner/admin/gerente)
CREATE POLICY "Users can view company users from their company" 
  ON public.company_users FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Apenas owners/admins podem criar usuários
CREATE POLICY "Owners and admins can create company users" 
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Apenas owners/admins podem atualizar usuários
CREATE POLICY "Owners and admins can update company users" 
  ON public.company_users FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Apenas owners/admins podem deletar usuários
CREATE POLICY "Owners and admins can delete company users" 
  ON public.company_users FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_company_users_updated_at 
  BEFORE UPDATE ON public.company_users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

