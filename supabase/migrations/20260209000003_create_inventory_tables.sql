-- Migration: Criar tabelas do sistema de inventário
-- Cria todas as tabelas necessárias: suppliers, part_categories, parts, stock_entries, stock_exits, stock_adjustments

-- ============================================================================
-- TABELA 1: suppliers (Fornecedores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- TABELA 2: part_categories (Categorias de Peças)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.part_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- TABELA 3: parts (Catálogo de Peças)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.part_categories(id) ON DELETE RESTRICT NOT NULL,
  car_model_reference TEXT,
  unit TEXT NOT NULL CHECK (unit IN ('un', 'L', 'kg', 'conj', 'rolo', 'jogo')),
  min_stock DECIMAL(10,2) DEFAULT 0,
  warehouse_location TEXT,
  average_price DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- TABELA 4: stock_entries (Entradas - Compras)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT UNIQUE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT NOT NULL,
  part_id UUID REFERENCES public.parts(id) ON DELETE RESTRICT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  invoice_number TEXT,
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- TABELA 5: stock_exits (Saídas - Requisições)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_exits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exit_number TEXT UNIQUE NOT NULL,
  exit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  part_id UUID REFERENCES public.parts(id) ON DELETE RESTRICT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  car_mileage DECIMAL(10,2),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  delivered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  exit_type TEXT NOT NULL DEFAULT 'other' 
    CHECK (exit_type IN ('preventive_maintenance', 'corrective_maintenance', 'urgent_repair', 'internal_use', 'other')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- TABELA 6: stock_adjustments (Ajustes de Inventário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number TEXT UNIQUE NOT NULL,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  part_id UUID REFERENCES public.parts(id) ON DELETE RESTRICT NOT NULL,
  system_stock DECIMAL(10,2) NOT NULL,
  physical_stock DECIMAL(10,2) NOT NULL,
  difference DECIMAL(10,2) GENERATED ALWAYS AS (physical_stock - system_stock) STORED,
  reason TEXT NOT NULL DEFAULT 'physical_count' 
    CHECK (reason IN ('loss', 'theft', 'damage', 'registration_error', 'physical_count', 'other')),
  reason_description TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'applied', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE public.suppliers IS 'Cadastro de fornecedores de peças';
COMMENT ON TABLE public.part_categories IS 'Categorias de peças (ex: Travões, Motor, Elétrico)';
COMMENT ON TABLE public.parts IS 'Catálogo completo de peças';
COMMENT ON TABLE public.stock_entries IS 'Registo de entradas/compras de peças';
COMMENT ON TABLE public.stock_exits IS 'Registo de saídas/requisições de peças';
COMMENT ON TABLE public.stock_adjustments IS 'Ajustes de inventário (contagens físicas, perdas, etc.)';
