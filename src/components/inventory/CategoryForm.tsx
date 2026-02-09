import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormProps {
  category: Category | null;
  onClose: () => void;
}

export const CategoryForm = ({ category, onClose }: CategoryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: category?.code || "",
    name: category?.name || "",
    description: category?.description || "",
    is_active: category?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        const { error } = await supabase
          .from("part_categories")
          .update(formData)
          .eq("id", category.id);

        if (error) throw error;
        toast.success("Categoria atualizada com sucesso");
      } else {
        // Se código está vazio, deixar NULL para trigger gerar automaticamente
        const insertData = {
          ...formData,
          code: formData.code.trim() === "" ? null : formData.code.toUpperCase(),
        };
        
        const { error } = await supabase
          .from("part_categories")
          .insert([insertData])
          .select();

        if (error) throw error;
        toast.success("Categoria cadastrada com sucesso");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Será gerado automaticamente do nome"
            maxLength={10}
            disabled={!category} // Permitir editar apenas se estiver editando
          />
          <p className="text-xs text-muted-foreground">
            {category ? "Pode editar o código manualmente" : "Código será gerado automaticamente do nome"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Ativo</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : category ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
};
