-- Create cars table
CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  car_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  drive_type TEXT NOT NULL,
  seats INTEGER NOT NULL,
  fuel_type TEXT NOT NULL,
  price_city_with_driver DECIMAL(10,2) NOT NULL,
  price_city_without_driver DECIMAL(10,2) NOT NULL,
  price_outside_with_driver DECIMAL(10,2) NOT NULL,
  price_outside_without_driver DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  pickup_fee DECIMAL(10,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_document TEXT,
  drivers_license TEXT,
  address TEXT,
  birth_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id) ON DELETE RESTRICT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('city', 'outside')),
  with_driver BOOLEAN DEFAULT false,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  deposit_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checkouts table (car departures)
CREATE TABLE public.checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE RESTRICT NOT NULL UNIQUE,
  checkout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  initial_km INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checkins table (car returns)
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE RESTRICT NOT NULL UNIQUE,
  checkin_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  final_km INTEGER NOT NULL,
  deposit_returned BOOLEAN DEFAULT false,
  fines_amount DECIMAL(10,2) DEFAULT 0,
  extra_fees_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Create policies (authenticated users can do everything - internal system)
CREATE POLICY "Authenticated users can view cars" ON public.cars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cars" ON public.cars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cars" ON public.cars FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cars" ON public.cars FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view checkouts" ON public.checkouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert checkouts" ON public.checkouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update checkouts" ON public.checkouts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete checkouts" ON public.checkouts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view checkins" ON public.checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert checkins" ON public.checkins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update checkins" ON public.checkins FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete checkins" ON public.checkins FOR DELETE TO authenticated USING (true);

-- Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance on reservation queries
CREATE INDEX idx_reservations_car_dates ON public.reservations(car_id, start_date, end_date);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_cars_available ON public.cars(is_available);