-- Migration: Criar índices para performance nas tabelas de inventário
-- Índices em foreign keys e campos de busca frequente

-- ============================================================================
-- ÍNDICES PARA suppliers
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);

-- ============================================================================
-- ÍNDICES PARA part_categories
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_part_categories_code ON public.part_categories(code);
CREATE INDEX IF NOT EXISTS idx_part_categories_is_active ON public.part_categories(is_active);

-- ============================================================================
-- ÍNDICES PARA parts
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_parts_code ON public.parts(code);
CREATE INDEX IF NOT EXISTS idx_parts_category_id ON public.parts(category_id);
CREATE INDEX IF NOT EXISTS idx_parts_name ON public.parts(name);
CREATE INDEX IF NOT EXISTS idx_parts_car_model_reference ON public.parts(car_model_reference);
CREATE INDEX IF NOT EXISTS idx_parts_is_active ON public.parts(is_active);

-- ============================================================================
-- ÍNDICES PARA stock_entries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stock_entries_entry_number ON public.stock_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_stock_entries_entry_date ON public.stock_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_stock_entries_supplier_id ON public.stock_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_part_id ON public.stock_entries(part_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_purchased_by ON public.stock_entries(purchased_by);
CREATE INDEX IF NOT EXISTS idx_stock_entries_part_date ON public.stock_entries(part_id, entry_date);

-- ============================================================================
-- ÍNDICES PARA stock_exits
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stock_exits_exit_number ON public.stock_exits(exit_number);
CREATE INDEX IF NOT EXISTS idx_stock_exits_exit_date ON public.stock_exits(exit_date);
CREATE INDEX IF NOT EXISTS idx_stock_exits_part_id ON public.stock_exits(part_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_car_id ON public.stock_exits(car_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_status ON public.stock_exits(status);
CREATE INDEX IF NOT EXISTS idx_stock_exits_requested_by ON public.stock_exits(requested_by);
CREATE INDEX IF NOT EXISTS idx_stock_exits_delivered_by ON public.stock_exits(delivered_by);
CREATE INDEX IF NOT EXISTS idx_stock_exits_part_status ON public.stock_exits(part_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_exits_car_date ON public.stock_exits(car_id, exit_date);

-- ============================================================================
-- ÍNDICES PARA stock_adjustments
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_adjustment_number ON public.stock_adjustments(adjustment_number);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_adjustment_date ON public.stock_adjustments(adjustment_date);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_part_id ON public.stock_adjustments(part_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_status ON public.stock_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_performed_by ON public.stock_adjustments(performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_part_status ON public.stock_adjustments(part_id, status);

-- Comentários para documentação
COMMENT ON INDEX idx_stock_entries_part_date IS 'Índice composto para queries de histórico de entradas por peça';
COMMENT ON INDEX idx_stock_exits_part_status IS 'Índice composto para queries de saídas por peça e status';
COMMENT ON INDEX idx_stock_exits_car_date IS 'Índice composto para queries de consumo por viatura';
COMMENT ON INDEX idx_stock_adjustments_part_status IS 'Índice composto para queries de ajustes por peça e status';
