import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SupplierFormProps {
  supplier: Supplier | null;
  onClose: () => void;
}

export const SupplierForm = ({ supplier, onClose }: SupplierFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: supplier?.code || "",
    name: supplier?.name || "",
    contact_name: supplier?.contact_name || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
    tax_id: supplier?.tax_id || "",
    notes: supplier?.notes || "",
    is_active: supplier?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (supplier) {
        const { error } = await supabase
          .from("suppliers")
          .update(formData)
          .eq("id", supplier.id);

        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso");
      } else {
        // Se código está vazio, deixar NULL para trigger gerar automaticamente
        const insertData = {
          ...formData,
          code: formData.code.trim() === "" ? null : formData.code.toUpperCase(),
        };
        
        const { error } = await supabase
          .from("suppliers")
          .insert([insertData])
          .select();

        if (error) throw error;
        toast.success("Fornecedor cadastrado com sucesso");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar fornecedor");
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
            placeholder="Será gerado automaticamente (FORN001)"
            disabled={!supplier} // Permitir editar apenas se estiver editando
          />
          <p className="text-xs text-muted-foreground">
            {supplier ? "Pode editar o código manualmente" : "Código será gerado automaticamente"}
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

        <div className="space-y-2">
          <Label htmlFor="contact_name">Nome do Contacto</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+244 923 456 789"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_id">NIF</Label>
          <Input
            id="tax_id"
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
          {loading ? "Salvando..." : supplier ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
};
