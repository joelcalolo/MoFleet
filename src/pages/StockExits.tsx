import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { StockExitForm, StockExit } from "@/components/inventory/StockExitForm";
import { StockExitList } from "@/components/inventory/StockExitList";

const StockExits = () => {
  const [exits, setExits] = useState<StockExit[]>([]);
  const [parts, setParts] = useState<Record<string, string>>({});
  const [cars, setCars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExit, setEditingExit] = useState<StockExit | null>(null);

  useEffect(() => {
    fetchExits();
    fetchParts();
    fetchCars();
  }, []);

  const fetchExits = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_exits")
        .select("*")
        .order("exit_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExits(data || []);
    } catch (error) {
      console.error("Error fetching exits:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      const { data } = await supabase.from("parts").select("id, name");
      if (data) {
        const partMap: Record<string, string> = {};
        data.forEach((p) => {
          partMap[p.id] = p.name;
        });
        setParts(partMap);
      }
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const fetchCars = async () => {
    try {
      const { data } = await supabase.from("cars").select("id, license_plate, brand, model");
      if (data) {
        const carMap: Record<string, string> = {};
        data.forEach((c) => {
          carMap[c.id] = `${c.brand} ${c.model} - ${c.license_plate}`;
        });
        setCars(carMap);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  const handleEdit = (exit: StockExit) => {
    setEditingExit(exit);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingExit(null);
    fetchExits();
  };

  const handleStatusChange = (exitId: string, newStatus: string) => {
    // Atualizar a lista localmente após mudança de status
    setExits(prevExits =>
      prevExits.map(exit =>
        exit.id === exitId ? { ...exit, status: newStatus } : exit
      )
    );
    // Recarregar para garantir sincronização
    fetchExits();
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Saídas de Stock</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Registe requisições e utilizações de peças</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Saída
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingExit ? "Editar Saída" : "Nova Saída"}</CardTitle>
            </CardHeader>
            <CardContent>
              <StockExitForm exit={editingExit} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <StockExitList
            exits={exits}
            loading={loading}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            parts={parts}
            cars={cars}
          />
        )}
      </div>
    </Layout>
  );
};

export default StockExits;
