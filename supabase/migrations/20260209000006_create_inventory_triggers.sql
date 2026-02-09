-- Migration: Criar triggers para o sistema de inventário
-- Triggers para gerar números sequenciais, atualizar preço médio e aplicar ajustes

-- ============================================================================
-- TRIGGER 1: Gerar entry_number automaticamente antes de INSERT em stock_entries
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_entry_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.entry_number IS NULL OR NEW.entry_number = '' THEN
    NEW.entry_number := public.generate_entry_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_entry_number
  BEFORE INSERT ON public.stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_entry_number();

-- ============================================================================
-- TRIGGER 2: Gerar exit_number automaticamente antes de INSERT em stock_exits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_exit_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.exit_number IS NULL OR NEW.exit_number = '' THEN
    NEW.exit_number := public.generate_exit_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_exit_number
  BEFORE INSERT ON public.stock_exits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_exit_number();

-- ============================================================================
-- TRIGGER 3: Gerar adjustment_number automaticamente antes de INSERT em stock_adjustments
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_adjustment_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.adjustment_number IS NULL OR NEW.adjustment_number = '' THEN
    NEW.adjustment_number := public.generate_adjustment_number();
  END IF;
  
  -- Preencher system_stock com stock atual se não fornecido
  IF NEW.system_stock IS NULL THEN
    NEW.system_stock := public.calculate_current_stock(NEW.part_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_adjustment_number
  BEFORE INSERT ON public.stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_adjustment_number();

-- ============================================================================
-- TRIGGER 4: Atualizar preço médio após INSERT em stock_entries
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_average_price()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_avg_price DECIMAL(15,2);
BEGIN
  -- Calcular novo preço médio baseado em todas as entradas
  SELECT COALESCE(AVG(unit_price), 0)
  INTO new_avg_price
  FROM public.stock_entries
  WHERE part_id = NEW.part_id;
  
  -- Atualizar preço médio na tabela parts
  UPDATE public.parts
  SET average_price = new_avg_price
  WHERE id = NEW.part_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_average_price
  AFTER INSERT ON public.stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_average_price();

-- ============================================================================
-- TRIGGER 5: Aplicar ajuste quando status muda para 'applied' em stock_adjustments
-- ============================================================================
CREATE OR REPLACE FUNCTION public.apply_stock_adjustment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se status mudou de qualquer coisa para 'applied'
  IF NEW.status = 'applied' AND (OLD.status IS NULL OR OLD.status != 'applied') THEN
    -- O ajuste já está aplicado logicamente (a VIEW current_stock já considera ajustes com status 'applied')
    -- Não precisamos fazer nada aqui, apenas garantir que não pode voltar para pending
    NULL;
  END IF;
  
  -- Se status mudou de 'applied' para outro, não permitir (ajustes aplicados não podem ser revertidos facilmente)
  IF OLD.status = 'applied' AND NEW.status != 'applied' THEN
    RAISE EXCEPTION 'Não é possível alterar status de ajuste já aplicado';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_apply_stock_adjustment
  BEFORE UPDATE ON public.stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_stock_adjustment();

-- ============================================================================
-- TRIGGER 6: Atualizar updated_at automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar trigger updated_at em todas as tabelas de inventário
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_part_categories_updated_at
  BEFORE UPDATE ON public.part_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stock_entries_updated_at
  BEFORE UPDATE ON public.stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stock_exits_updated_at
  BEFORE UPDATE ON public.stock_exits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stock_adjustments_updated_at
  BEFORE UPDATE ON public.stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
