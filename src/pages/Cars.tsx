import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { CarForm } from "@/components/cars/CarForm";
import { CarList } from "@/components/cars/CarList";

export interface Car {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
  car_type: string;
  transmission: string;
  drive_type: string;
  seats: number;
  fuel_type: string;
  price_city_with_driver: number;
  price_city_without_driver: number;
  price_outside_with_driver: number;
  price_outside_without_driver: number;
  delivery_fee: number;
  pickup_fee: number;
  deposit_amount: number;
  notes?: string;
  is_available: boolean;
}

const Cars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("brand", { ascending: true });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCar(null);
    fetchCars();
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Carros</h1>
            <p className="text-muted-foreground">Cadastre e gerencie a frota de veículos</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Carro
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingCar ? "Editar Carro" : "Novo Carro"}</CardTitle>
            </CardHeader>
            <CardContent>
              <CarForm car={editingCar} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <CarList cars={cars} loading={loading} onEdit={handleEdit} onRefresh={fetchCars} />
        )}
      </div>
    </Layout>
  );
};

export default Cars;