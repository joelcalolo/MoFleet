import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { StockAdjustmentForm, StockAdjustment } from "@/components/inventory/StockAdjustmentForm";
import { StockAdjustmentList } from "@/components/inventory/StockAdjustmentList";

const StockAdjustments = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [parts, setParts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<StockAdjustment | null>(null);

  useEffect(() => {
    fetchAdjustments();
    fetchParts();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_adjustments")
        .select("*")
        .order("adjustment_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdjustments(data || []);
    } catch (error) {
      console.error("Error fetching adjustments:", error);
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

  const handleEdit = (adjustment: StockAdjustment) => {
    setEditingAdjustment(adjustment);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingAdjustment(null);
    fetchAdjustments();
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Ajustes de Inventário</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Registe contagens físicas e ajustes de stock</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Ajuste
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingAdjustment ? "Editar Ajuste" : "Novo Ajuste"}</CardTitle>
            </CardHeader>
            <CardContent>
              <StockAdjustmentForm adjustment={editingAdjustment} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <StockAdjustmentList
            adjustments={adjustments}
            loading={loading}
            onEdit={handleEdit}
            parts={parts}
          />
        )}
      </div>
    </Layout>
  );
};

export default StockAdjustments;
