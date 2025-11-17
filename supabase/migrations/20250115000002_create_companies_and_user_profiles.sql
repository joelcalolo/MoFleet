-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_profiles table to link users to companies
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add company_id to existing tables
ALTER TABLE public.cars ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.reservations ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
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

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Update existing policies to filter by company_id
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can update cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can delete cars" ON public.cars;

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

-- Similar updates for customers
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

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

-- Similar updates for reservations
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON public.reservations;

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

-- Create trigger for timestamp updates on companies
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create company and profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Create a company for the new user
  INSERT INTO public.companies (name, email)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'), NEW.email)
  RETURNING id INTO new_company_id;

  -- Create user profile linking to the company
  INSERT INTO public.user_profiles (user_id, company_id, role, is_active)
  VALUES (NEW.id, new_company_id, 'owner', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

