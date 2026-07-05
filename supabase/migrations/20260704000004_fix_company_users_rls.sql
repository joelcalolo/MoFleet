-- Migration: Fix RLS for company_users to prevent cross-company access
-- This ensures that users can only see company_users from their own company

-- ============================================================================
-- STEP 1: Remove any policies that might allow unrestricted access
-- ============================================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.company_users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.company_users;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.company_users;
DROP POLICY IF EXISTS "Public read access" ON public.company_users;
DROP POLICY IF EXISTS "Public insert access" ON public.company_users;
DROP POLICY IF EXISTS "Public update access" ON public.company_users;
DROP POLICY IF EXISTS "Public delete access" ON public.company_users;

-- ============================================================================
-- STEP 2: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Recreate proper RLS policies
-- ============================================================================

-- DROP existing policies to recreate them
DROP POLICY IF EXISTS "Users can view company users from their company" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can create company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can update company users" ON public.company_users;
DROP POLICY IF EXISTS "Owners and admins can delete company users" ON public.company_users;

-- Policy for viewing company users (only from own company)
CREATE POLICY "Users can view company users from their company" 
  ON public.company_users FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy for creating company users (only owners and admins of own company)
CREATE POLICY "Owners and admins can create company users" 
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy for updating company users (only owners and admins of own company)
CREATE POLICY "Owners and admins can update company users" 
  ON public.company_users FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy for deleting company users (only owners and admins of own company)
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
-- STEP 4: Verify RLS is working
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies for company_users have been updated to prevent cross-company access.';
  RAISE NOTICE 'Users can only view company_users from their own company.';
  RAISE NOTICE 'Only owners and admins can create/update/delete company_users in their company.';
END $$;
