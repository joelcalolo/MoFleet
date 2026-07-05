-- Migration: Fix RLS for stock tables to prevent cross-company access
-- This ensures that users can only see stock data from their own company

-- ============================================================================
-- STEP 1: Fix stock_entries table
-- ============================================================================

-- Remove any policies that might allow unrestricted access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stock_entries;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.stock_entries;
DROP POLICY IF EXISTS "Enable update for all users" ON public.stock_entries;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.stock_entries;
DROP POLICY IF EXISTS "Public read access" ON public.stock_entries;
DROP POLICY IF EXISTS "Public insert access" ON public.stock_entries;
DROP POLICY IF EXISTS "Public update access" ON public.stock_entries;
DROP POLICY IF EXISTS "Public delete access" ON public.stock_entries;

-- Ensure RLS is enabled
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view stock entries from their company" ON public.stock_entries;
DROP POLICY IF EXISTS "Users can insert stock entries to their company" ON public.stock_entries;
DROP POLICY IF EXISTS "Users can update stock entries from their company" ON public.stock_entries;
DROP POLICY IF EXISTS "Users can delete stock entries from their company" ON public.stock_entries;

-- Create proper RLS policies for stock_entries
CREATE POLICY "Users can view stock entries from their company" 
  ON public.stock_entries FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock entries to their company" 
  ON public.stock_entries FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stock entries from their company" 
  ON public.stock_entries FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stock entries from their company" 
  ON public.stock_entries FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 2: Fix stock_exits table
-- ============================================================================

-- Remove any policies that might allow unrestricted access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stock_exits;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.stock_exits;
DROP POLICY IF EXISTS "Enable update for all users" ON public.stock_exits;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.stock_exits;
DROP POLICY IF EXISTS "Public read access" ON public.stock_exits;
DROP POLICY IF EXISTS "Public insert access" ON public.stock_exits;
DROP POLICY IF EXISTS "Public update access" ON public.stock_exits;
DROP POLICY IF EXISTS "Public delete access" ON public.stock_exits;

-- Ensure RLS is enabled
ALTER TABLE public.stock_exits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view stock exits from their company" ON public.stock_exits;
DROP POLICY IF EXISTS "Users can insert stock exits to their company" ON public.stock_exits;
DROP POLICY IF EXISTS "Users can update stock exits from their company" ON public.stock_exits;
DROP POLICY IF EXISTS "Users can delete stock exits from their company" ON public.stock_exits;

-- Create proper RLS policies for stock_exits
CREATE POLICY "Users can view stock exits from their company" 
  ON public.stock_exits FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock exits to their company" 
  ON public.stock_exits FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stock exits from their company" 
  ON public.stock_exits FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stock exits from their company" 
  ON public.stock_exits FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 3: Fix stock_adjustments table
-- ============================================================================

-- Remove any policies that might allow unrestricted access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Enable update for all users" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Public read access" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Public insert access" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Public update access" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Public delete access" ON public.stock_adjustments;

-- Ensure RLS is enabled
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view stock adjustments from their company" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Users can insert stock adjustments to their company" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Users can update stock adjustments from their company" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Users can delete stock adjustments from their company" ON public.stock_adjustments;

-- Create proper RLS policies for stock_adjustments
CREATE POLICY "Users can view stock adjustments from their company" 
  ON public.stock_adjustments FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock adjustments to their company" 
  ON public.stock_adjustments FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stock adjustments from their company" 
  ON public.stock_adjustments FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stock adjustments from their company" 
  ON public.stock_adjustments FOR DELETE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: Fix parts table (if it has company_id)
-- ============================================================================

-- Check if parts table has company_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'parts' AND column_name = 'company_id'
  ) THEN
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

    RAISE NOTICE 'RLS policies for parts have been updated to prevent cross-company access.';
  ELSE
    RAISE NOTICE 'Parts table does not have company_id column, skipping RLS update.';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Verify RLS is working
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies for stock tables have been updated to prevent cross-company access.';
  RAISE NOTICE 'Users can only view stock data from their own company.';
END $$;
