import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { PartForm, Part } from "@/components/inventory/PartForm";
import { PartList } from "@/components/inventory/PartList";

const Parts = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error("Error fetching parts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingPart(null);
    fetchParts();
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Catálogo de Peças</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Cadastre e gerencie peças do inventário</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Peça
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingPart ? "Editar Peça" : "Nova Peça"}</CardTitle>
            </CardHeader>
            <CardContent>
              <PartForm part={editingPart} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <PartList parts={parts} loading={loading} onEdit={handleEdit} onRefresh={fetchParts} />
        )}
      </div>
    </Layout>
  );
};

export default Parts;
