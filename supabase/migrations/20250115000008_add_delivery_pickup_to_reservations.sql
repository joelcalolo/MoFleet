-- Add with_delivery and with_pickup fields to reservations table
ALTER TABLE public.reservations 
ADD COLUMN with_delivery BOOLEAN DEFAULT true,
ADD COLUMN with_pickup BOOLEAN DEFAULT true;

-- Add comments to explain the fields
COMMENT ON COLUMN public.reservations.with_delivery IS 'Indica se a reserva inclui serviço de entrega do veículo';
COMMENT ON COLUMN public.reservations.with_pickup IS 'Indica se a reserva inclui serviço de recolha do veículo';

-- Update existing reservations to have both services enabled by default
UPDATE public.reservations 
SET with_delivery = true, with_pickup = true 
WHERE with_delivery IS NULL OR with_pickup IS NULL;

