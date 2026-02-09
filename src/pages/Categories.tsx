import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { CategoryForm, Category } from "@/components/inventory/CategoryForm";
import { CategoryList } from "@/components/inventory/CategoryList";

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("part_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Categorias de Peças</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Organize as peças por categorias</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryForm category={editingCategory} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <CategoryList categories={categories} loading={loading} onEdit={handleEdit} onRefresh={fetchCategories} />
        )}
      </div>
    </Layout>
  );
};

export default Categories;
