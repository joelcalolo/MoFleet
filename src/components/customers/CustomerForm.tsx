import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Customer } from "@/pages/Customers";
import { useCompany } from "@/hooks/useCompany";
import { handleError, logError } from "@/lib/errorHandler";

interface CustomerFormProps {
  customer: Customer | null;
  onClose: () => void;
}

export const CustomerForm = ({ customer, onClose }: CustomerFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    id_document: customer?.id_document || "",
    drivers_license: customer?.drivers_license || "",
    address: customer?.address || "",
    birth_date: customer?.birth_date || null,  // Usar null em vez de string vazia
    notes: customer?.notes || "",
    is_active: customer?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar dados para envio, convertendo strings vazias para null
      const dataToSave = {
        ...formData,
        email: formData.email || null,
        id_document: formData.id_document || null,
        drivers_license: formData.drivers_license || null,
        address: formData.address || null,
        birth_date: formData.birth_date || null,
        notes: formData.notes || null
      };

      if (customer) {
        const { error } = await supabase
          .from("customers")
          .update(dataToSave)
          .eq("id", customer.id);

        if (error) throw error;
        toast.success("Cliente atualizado com sucesso");
      } else {
        const { error } = await supabase.from("customers").insert([dataToSave]);

        if (error) throw error;
        toast.success("Cliente cadastrado com sucesso");
      }

      onClose();
    } catch (error: any) {
      logError(error, "CustomerForm");
      const errorMessage = handleError(error, "Erro ao salvar cliente");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
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
          <Label htmlFor="id_document">BI/Passaporte</Label>
          <Input
            id="id_document"
            value={formData.id_document}
            onChange={(e) => setFormData({ ...formData, id_document: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="drivers_license">Carta de Condução</Label>
          <Input
            id="drivers_license"
            value={formData.drivers_license}
            onChange={(e) => setFormData({ ...formData, drivers_license: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de Nascimento</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : customer ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
};