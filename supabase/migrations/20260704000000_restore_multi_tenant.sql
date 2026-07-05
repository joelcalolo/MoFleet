-- Migration: Restore Multi-Tenant Functionality
-- This migration reverses the mono-tenant conversion and restores multi-tenancy
-- It adds back company_id columns, company_users table, and multi-tenant RLS policies

-- ============================================================================
-- FASE 0: Habilitar extensão pgcrypto para hash de senhas
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- FASE 1: Remover Políticas RLS Mono-Tenant
-- ============================================================================

-- ===== CARS =====
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can update cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can delete cars" ON public.cars;

-- ===== CUSTOMERS =====
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- ===== RESERVATIONS =====
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON public.reservations;

-- ===== CHECKOUTS =====
DROP POLICY IF EXISTS "Authenticated users can view checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can insert checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can update checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can delete checkouts" ON public.checkouts;

-- ===== CHECKINS =====
DROP POLICY IF EXISTS "Authenticated users can view checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can insert checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can update checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can delete checkins" ON public.checkins;

-- ===== COMPANIES =====
DROP POLICY IF EXISTS "Companies: authenticated read" ON public.companies;
DROP POLICY IF EXISTS "Companies: admin or owner can update" ON public.companies;
DROP POLICY IF EXISTS "Companies: admin or owner can insert" ON public.companies;

-- ===== USER_PROFILES =====
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.user_profiles;

-- ============================================================================
-- FASE 2: Adicionar company_id às Tabelas Principais
-- ============================================================================

-- Adicionar company_id às tabelas se não existir
DO $$
BEGIN
  -- CARS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'cars' AND column_name = 'company_id') THEN
    ALTER TABLE public.cars ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;

  -- CUSTOMERS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'company_id') THEN
    ALTER TABLE public.customers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;

  -- RESERVATIONS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'company_id') THEN
    ALTER TABLE public.reservations ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;

  -- CHECKOUTS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'checkouts' AND column_name = 'company_id') THEN
    ALTER TABLE public.checkouts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;

  -- CHECKINS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'checkins' AND column_name = 'company_id') THEN
    ALTER TABLE public.checkins ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- FASE 3: Recriar Tabela company_users
-- ============================================================================

DROP TABLE IF EXISTS public.company_users CASCADE;

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

-- ============================================================================
-- FASE 4: Adicionar company_id de volta a user_profiles
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'company_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- FASE 5: Criar/Atualizar Funções Auxiliares
-- ============================================================================

-- Função para remover acentos (se não existir)
CREATE OR REPLACE FUNCTION public.remove_accents(text_in TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Se unaccent estiver disponível, usar
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    RETURN unaccent(text_in);
  ELSE
    -- Fallback: substituir acentos manualmente
    RETURN translate(
      text_in,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeeiiiiooooouuuucAAAAAEEEEEIIIIOOOOOUUUUC'
    );
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para autenticar company user
CREATE OR REPLACE FUNCTION public.authenticate_company_user(
  p_subdomain TEXT,
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  username TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.id,
    cu.company_id,
    cu.username,
    cu.role,
    cu.is_active
  FROM public.company_users cu
  INNER JOIN public.companies c ON c.id = cu.company_id
  WHERE c.subdomain = p_subdomain
    AND cu.username = p_username
    AND cu.password_hash = crypt(p_password, cu.password_hash)
    AND cu.is_active = true;
END;
$$;

-- Permitir que usuários autenticados chamem esta função
GRANT EXECUTE ON FUNCTION public.authenticate_company_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_company_user TO anon;

-- Função para obter empresa por subdomain
CREATE OR REPLACE FUNCTION public.get_company_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subdomain TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.subdomain
  FROM public.companies c
  WHERE c.subdomain = p_subdomain;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_by_subdomain TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_by_subdomain TO anon;

-- ============================================================================
-- FASE 6: Criar função remove_accents se não existir
-- ============================================================================

DROP FUNCTION IF EXISTS public.remove_accents(text);

CREATE OR REPLACE FUNCTION public.remove_accents(text_param text)
RETURNS text AS $$
BEGIN
  RETURN translate(
    text_param,
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FASE 7: Atualizar handle_new_user para criar empresa com subdomain
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
  generated_subdomain TEXT;
  subdomain_counter INTEGER := 0;
BEGIN
  -- Obter nome da empresa
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa');
  
  -- Gerar subdomain baseado no nome
  generated_subdomain := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        public.remove_accents(company_name),
        '[^a-z0-9]', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  generated_subdomain := TRIM(BOTH '-' FROM generated_subdomain);
  generated_subdomain := SUBSTRING(generated_subdomain FROM 1 FOR 50);
  
  -- Se subdomain estiver vazio, usar padrão
  IF generated_subdomain = '' OR generated_subdomain IS NULL THEN
    generated_subdomain := 'empresa-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
  END IF;
  
  -- Verificar se subdomain já existe e adicionar número se necessário
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE subdomain = generated_subdomain || CASE WHEN subdomain_counter > 0 THEN '-' || subdomain_counter::TEXT ELSE '' END) LOOP
    subdomain_counter := subdomain_counter + 1;
  END LOOP;
  
  IF subdomain_counter > 0 THEN
    generated_subdomain := generated_subdomain || '-' || subdomain_counter::TEXT;
  END IF;
  
  -- Criar empresa com subdomain
  INSERT INTO public.companies (name, email, subdomain)
  VALUES (company_name, NEW.email, generated_subdomain)
  RETURNING id INTO new_company_id;

  -- Criar user profile
  INSERT INTO public.user_profiles (user_id, company_id, role, is_active)
  VALUES (NEW.id, new_company_id, 'owner', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FASE 7: Backfill company_id para dados existentes
-- ============================================================================

-- Criar uma empresa padrão para dados existentes se não existir
DO $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Verificar se já existe alguma empresa
  SELECT id INTO default_company_id FROM public.companies LIMIT 1;
  
  IF default_company_id IS NULL THEN
    -- Criar empresa padrão
    INSERT INTO public.companies (name, email, subdomain)
    VALUES ('Empresa Principal', 'admin@mofleet.com', 'principal')
    RETURNING id INTO default_company_id;
  END IF;
  
  -- Desabilitar triggers temporariamente para evitar conflitos durante backfill
  -- Desabilitar apenas triggers de usuário, não triggers de sistema
  ALTER TABLE public.reservations DISABLE TRIGGER USER;
  
  -- Backfill company_id em todas as tabelas
  -- CARS
  UPDATE public.cars SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- CUSTOMERS
  UPDATE public.customers SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- RESERVATIONS
  UPDATE public.reservations SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- CHECKOUTS
  UPDATE public.checkouts SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- CHECKINS
  UPDATE public.checkins SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- USER_PROFILES
  UPDATE public.user_profiles SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Reabilitar triggers
  ALTER TABLE public.reservations ENABLE TRIGGER USER;
END $$;

-- ============================================================================
-- FASE 8: Recriar Políticas RLS Multi-Tenant
-- ============================================================================

-- ===== COMPANIES =====
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON public.companies;

CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT TO authenticated 
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own company" ON public.companies FOR UPDATE TO authenticated 
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own company" ON public.companies FOR INSERT TO authenticated 
  WITH CHECK (true);

-- ===== USER_PROFILES =====
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- ===== CARS =====
DROP POLICY IF EXISTS "Users can view cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can insert cars to their company" ON public.cars;
DROP POLICY IF EXISTS "Users can update cars from their company" ON public.cars;
DROP POLICY IF EXISTS "Users can delete cars from their company" ON public.cars;

CREATE POLICY "Users can view cars from their company" ON public.cars FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cars to their company" ON public.cars FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cars from their company" ON public.cars FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cars from their company" ON public.cars FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ===== CUSTOMERS =====
DROP POLICY IF EXISTS "Users can view customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers to their company" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers from their company" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers from their company" ON public.customers;

CREATE POLICY "Users can view customers from their company" ON public.customers FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers to their company" ON public.customers FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers from their company" ON public.customers FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete customers from their company" ON public.customers FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ===== RESERVATIONS =====
DROP POLICY IF EXISTS "Users can view reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert reservations to their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can update reservations from their company" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete reservations from their company" ON public.reservations;

CREATE POLICY "Users can view reservations from their company" ON public.reservations FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reservations to their company" ON public.reservations FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reservations from their company" ON public.reservations FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reservations from their company" ON public.reservations FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ===== CHECKOUTS =====
DROP POLICY IF EXISTS "Users can view checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can insert checkouts to their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can update checkouts from their company" ON public.checkouts;
DROP POLICY IF EXISTS "Users can delete checkouts from their company" ON public.checkouts;

CREATE POLICY "Users can view checkouts from their company" ON public.checkouts FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkouts to their company" ON public.checkouts FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkouts from their company" ON public.checkouts FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkouts from their company" ON public.checkouts FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ===== CHECKINS =====
DROP POLICY IF EXISTS "Users can view checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can insert checkins to their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can update checkins from their company" ON public.checkins;
DROP POLICY IF EXISTS "Users can delete checkins from their company" ON public.checkins;

CREATE POLICY "Users can view checkins from their company" ON public.checkins FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkins to their company" ON public.checkins FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkins from their company" ON public.checkins FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkins from their company" ON public.checkins FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ===== COMPANY_USERS =====
DROP POLICY IF EXISTS "Users can view company users from their company" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can create company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can update company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can delete company users" ON public.company_users;

CREATE POLICY "Users can view company users from their company" 
  ON public.company_users FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can create company users" 
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update company users" 
  ON public.company_users FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete company users" 
  ON public.company_users FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- FASE 9: Adicionar índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_subdomain ON public.companies(subdomain);

-- ============================================================================
-- FASE 10: Atualizar comentários das tabelas
-- ============================================================================

COMMENT ON TABLE public.cars IS 'Tabela de carros - sistema multi-tenant';
COMMENT ON TABLE public.customers IS 'Tabela de clientes - sistema multi-tenant';
COMMENT ON TABLE public.reservations IS 'Tabela de reservas - sistema multi-tenant';
COMMENT ON TABLE public.company_users IS 'Tabela de usuários da empresa - sistema multi-tenant';
