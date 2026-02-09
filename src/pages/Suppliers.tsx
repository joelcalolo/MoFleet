import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { SupplierForm, Supplier } from "@/components/inventory/SupplierForm";
import { SupplierList } from "@/components/inventory/SupplierList";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingSupplier(null);
    fetchSuppliers();
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Fornecedores</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Cadastre e gerencie fornecedores de peças</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</CardTitle>
            </CardHeader>
            <CardContent>
              <SupplierForm supplier={editingSupplier} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <SupplierList suppliers={suppliers} loading={loading} onEdit={handleEdit} onRefresh={fetchSuppliers} />
        )}
      </div>
    </Layout>
  );
};

export default Suppliers;
