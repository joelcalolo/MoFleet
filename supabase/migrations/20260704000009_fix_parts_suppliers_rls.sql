-- Migration: Fix RLS for parts and suppliers tables to prevent cross-company access
-- This ensures that users can only see parts and suppliers from their own company

-- ============================================================================
-- STEP 1: Fix parts table RLS
-- ============================================================================

-- Remove any policies that might allow unrestricted access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parts;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.parts;
DROP POLICY IF EXISTS "Enable update for all users" ON public.parts;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.parts;
DROP POLICY IF EXISTS "Public read access" ON public.parts;
DROP POLICY IF EXISTS "Public insert access" ON public.parts;
DROP POLICY IF EXISTS "Public update access" ON public.parts;
DROP POLICY IF EXISTS "Public delete access" ON public.parts;

-- Ensure RLS is enabled
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view parts from their company" ON public.parts;
DROP POLICY IF EXISTS "Users can insert parts to their company" ON public.parts;
DROP POLICY IF EXISTS "Users can update parts from their company" ON public.parts;
DROP POLICY IF EXISTS "Users can delete parts from their company" ON public.parts;

-- Create proper RLS policies for parts
CREATE POLICY "Users can view parts from their company" 
  ON public.parts FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert parts to their company" 
  ON public.parts FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update parts from their company" 
  ON public.parts FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete parts from their company" 
  ON public.parts FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 2: Fix suppliers table RLS
-- ============================================================================

-- Remove any policies that might allow unrestricted access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable update for all users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.suppliers;
DROP POLICY IF EXISTS "Public read access" ON public.suppliers;
DROP POLICY IF EXISTS "Public insert access" ON public.suppliers;
DROP POLICY IF EXISTS "Public update access" ON public.suppliers;
DROP POLICY IF EXISTS "Public delete access" ON public.suppliers;

-- Ensure RLS is enabled
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view suppliers from their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers to their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers from their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers from their company" ON public.suppliers;

-- Create proper RLS policies for suppliers
CREATE POLICY "Users can view suppliers from their company" 
  ON public.suppliers FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert suppliers to their company" 
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update suppliers from their company" 
  ON public.suppliers FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete suppliers from their company" 
  ON public.suppliers FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 3: Verify RLS is working
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies for parts and suppliers have been updated to prevent cross-company access.';
  RAISE NOTICE 'Users can only view parts and suppliers from their own company.';
END $$;
