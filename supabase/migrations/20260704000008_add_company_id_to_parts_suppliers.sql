-- Migration: Add company_id to parts and suppliers tables
-- This adds company_id column for multi-tenancy isolation

-- ============================================================================
-- STEP 1: Add company_id to parts
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
-- STEP 2: Add company_id to suppliers
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'company_id') THEN
    ALTER TABLE public.suppliers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id to suppliers';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Backfill company_id for existing data
-- ============================================================================

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
  
  -- Backfill parts
  UPDATE public.parts SET company_id = default_company_id WHERE company_id IS NULL;
  RAISE NOTICE 'Backfilled company_id for parts';
  
  -- Backfill suppliers
  UPDATE public.suppliers SET company_id = default_company_id WHERE company_id IS NULL;
  RAISE NOTICE 'Backfilled company_id for suppliers';
  
  RAISE NOTICE 'All parts and suppliers have been updated with company_id';
END $$;

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_parts_company_id ON public.parts(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);
