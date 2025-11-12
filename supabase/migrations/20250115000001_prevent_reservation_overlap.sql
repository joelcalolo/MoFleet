-- Função para verificar sobreposição de reservas
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se existe alguma reserva ativa (não cancelada) que se sobrepõe com a nova/atualizada
  IF EXISTS (
    SELECT 1
    FROM public.reservations
    WHERE car_id = NEW.car_id
      AND id != NEW.id  -- Excluir a própria reserva se estiver sendo atualizada
      AND status != 'cancelled'  -- Ignorar reservas canceladas
      AND (
        -- Verificar sobreposição: dois intervalos se sobrepõem se start1 <= end2 AND start2 <= end1
        (start_date <= NEW.end_date AND end_date >= NEW.start_date)
      )
  ) THEN
    RAISE EXCEPTION 'Este carro já está reservado no período selecionado. Não é possível criar/atualizar esta reserva.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para verificar sobreposição antes de inserir ou atualizar
DROP TRIGGER IF EXISTS prevent_reservation_overlap_trigger ON public.reservations;
CREATE TRIGGER prevent_reservation_overlap_trigger
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION check_reservation_overlap();

