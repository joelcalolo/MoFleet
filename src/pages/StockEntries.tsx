import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { StockEntryForm, StockEntry } from "@/components/inventory/StockEntryForm";
import { StockEntryList } from "@/components/inventory/StockEntryList";

const StockEntries = () => {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Record<string, string>>({});
  const [parts, setParts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);

  useEffect(() => {
    fetchEntries();
    fetchSuppliers();
    fetchParts();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_entries")
        .select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await supabase.from("suppliers").select("id, name");
      if (data) {
        const supplierMap: Record<string, string> = {};
        data.forEach((s) => {
          supplierMap[s.id] = s.name;
        });
        setSuppliers(supplierMap);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
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

  const handleEdit = (entry: StockEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingEntry(null);
    fetchEntries();
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Entradas de Stock</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Registe compras e recepções de peças</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingEntry ? "Editar Entrada" : "Nova Entrada"}</CardTitle>
            </CardHeader>
            <CardContent>
              <StockEntryForm entry={editingEntry} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <StockEntryList
            entries={entries}
            loading={loading}
            onEdit={handleEdit}
            suppliers={suppliers}
            parts={parts}
          />
        )}
      </div>
    </Layout>
  );
};

export default StockEntries;
