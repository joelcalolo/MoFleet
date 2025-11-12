-- Add created_by field to reservations table
ALTER TABLE public.reservations 
ADD COLUMN created_by TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.reservations.created_by IS 'Nome do usuário/funcionário que criou a reserva';

