import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Supplier } from "./SupplierForm";
import { Part } from "./PartForm";

export interface StockEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  supplier_id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  invoice_number?: string;
  purchased_by?: string;
  purchased_by_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface StockEntryFormProps {
  entry: StockEntry | null;
  onClose: () => void;
}

export const StockEntryForm = ({ entry, onClose }: StockEntryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [formData, setFormData] = useState({
    entry_date: entry?.entry_date || new Date().toISOString().split("T")[0],
    supplier_id: entry?.supplier_id || "",
    part_id: entry?.part_id || "",
    quantity: entry?.quantity || 0,
    unit_price: entry?.unit_price || 0,
    invoice_number: entry?.invoice_number || "",
    purchased_by_name: entry?.purchased_by_name || "",
    notes: entry?.notes || "",
  });

  useEffect(() => {
    fetchSuppliers();
    fetchParts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchParts = async () => {
    try {
      const { data } = await supabase
        .from("parts")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setParts(data || []);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const entryData = {
        ...formData,
        purchased_by: user?.id || null, // Pode ser NULL se não houver usuário autenticado
      };

      if (entry) {
        const { error } = await supabase
          .from("stock_entries")
          .update(entryData)
          .eq("id", entry.id);

        if (error) throw error;
        toast.success("Entrada atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from("stock_entries")
          .insert([entryData])
          .select();

        if (error) throw error;
        toast.success("Entrada registrada com sucesso");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar entrada");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = formData.quantity * formData.unit_price;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entry_date">Data da Entrada *</Label>
          <Input
            id="entry_date"
            type="date"
            value={formData.entry_date}
            onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier_id">Fornecedor *</Label>
          <Select
            value={formData.supplier_id}
            onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="part_id">Peça *</Label>
          <Select
            value={formData.part_id}
            onValueChange={(value) => setFormData({ ...formData, part_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma peça" />
            </SelectTrigger>
            <SelectContent>
              {parts.map((part) => (
                <SelectItem key={part.id} value={part.id}>
                  {part.name} ({part.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_number">Número da Fatura</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchased_by_name">Quem Recebeu/Comprou *</Label>
          <Input
            id="purchased_by_name"
            value={formData.purchased_by_name}
            onChange={(e) => setFormData({ ...formData, purchased_by_name: e.target.value })}
            placeholder="Nome da pessoa que recebeu a peça"
            required
          />
          <p className="text-xs text-muted-foreground">
            Nome da pessoa física que recebeu/comprou (pode não ser usuário do sistema)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_price">Preço Unitário (AOA) *</Label>
          <Input
            id="unit_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total:</span>
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat("pt-AO", {
              style: "currency",
              currency: "AOA",
              minimumFractionDigits: 2,
            }).format(totalPrice)}
          </span>
        </div>
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : entry ? "Atualizar" : "Registrar Entrada"}
        </Button>
      </div>
    </form>
  );
};
