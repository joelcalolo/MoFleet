-- Migration: Add company_id to stock tables
-- This adds company_id column to stock tables for multi-tenancy

-- ============================================================================
-- STEP 1: Add company_id to stock_entries
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'stock_entries' AND column_name = 'company_id') THEN
    ALTER TABLE public.stock_entries ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id to stock_entries';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add company_id to stock_exits
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'stock_exits' AND column_name = 'company_id') THEN
    ALTER TABLE public.stock_exits ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id to stock_exits';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add company_id to stock_adjustments
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'stock_adjustments' AND column_name = 'company_id') THEN
    ALTER TABLE public.stock_adjustments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id to stock_adjustments';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add company_id to parts (if it doesn't exist)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'parts' AND column_name = 'company_id') THEN
    ALTER TABLE public.parts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id to parts';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Backfill company_id for existing data
-- ============================================================================

-- Get the default company (first company or create one if none exists)
DO $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Get the first company
  SELECT id INTO default_company_id FROM public.companies LIMIT 1;
  
  IF default_company_id IS NULL THEN
    -- Create a default company if none exists
    INSERT INTO public.companies (name, email, subdomain)
    VALUES ('Default Company', 'default@example.com', 'default')
    RETURNING id INTO default_company_id;
    RAISE NOTICE 'Created default company with ID: %', default_company_id;
  END IF;
  
  -- Backfill stock_entries
  UPDATE public.stock_entries SET company_id = default_company_id WHERE company_id IS NULL;
  RAISE NOTICE 'Backfilled company_id for stock_entries';
  
  -- Backfill stock_exits
  UPDATE public.stock_exits SET company_id = default_company_id WHERE company_id IS NULL;
  RAISE NOTICE 'Backfilled company_id for stock_exits';
  
  -- Backfill stock_adjustments
  UPDATE public.stock_adjustments SET company_id = default_company_id WHERE company_id IS NULL;
  RAISE NOTICE 'Backfilled company_id for stock_adjustments';
  
  -- Backfill parts
  UPDATE public.parts SET company_id = default_company_id WHERE company_id IS NULL;
  RAISE NOTICE 'Backfilled company_id for parts';
  
  RAISE NOTICE 'All stock tables have been updated with company_id';
END $$;

-- ============================================================================
-- STEP 6: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stock_entries_company_id ON public.stock_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_company_id ON public.stock_exits(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_company_id ON public.stock_adjustments(company_id);
CREATE INDEX IF NOT EXISTS idx_parts_company_id ON public.parts(company_id);
