import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Part } from "./PartForm";

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  adjustment_date: string;
  part_id: string;
  system_stock: number;
  physical_stock: number;
  difference: number;
  reason: string;
  reason_description?: string;
  performed_by: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface StockAdjustmentFormProps {
  adjustment: StockAdjustment | null;
  onClose: () => void;
}

export const StockAdjustmentForm = ({ adjustment, onClose }: StockAdjustmentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [formData, setFormData] = useState({
    adjustment_date: adjustment?.adjustment_date || new Date().toISOString().split("T")[0],
    part_id: adjustment?.part_id || "",
    system_stock: adjustment?.system_stock || 0,
    physical_stock: adjustment?.physical_stock || 0,
    reason: adjustment?.reason || "physical_count",
    reason_description: adjustment?.reason_description || "",
    status: adjustment?.status || "pending",
    notes: adjustment?.notes || "",
  });

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    if (formData.part_id && !adjustment) {
      fetchCurrentStock(formData.part_id);
    }
  }, [formData.part_id, adjustment]);

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

  const fetchCurrentStock = async (partId: string) => {
    try {
      const { data, error } = await supabase
        .rpc("calculate_current_stock", { p_part_id: partId });

      if (error) throw error;
      const stock = data || 0;
      setCurrentStock(stock);
      setFormData(prev => ({ ...prev, system_stock: stock }));
    } catch (error) {
      console.error("Error fetching current stock:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const adjustmentData = {
        ...formData,
        performed_by: user.id,
      };

      if (adjustment) {
        const { error } = await supabase
          .from("stock_adjustments")
          .update(adjustmentData)
          .eq("id", adjustment.id);

        if (error) throw error;
        toast.success("Ajuste atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("stock_adjustments")
          .insert([adjustmentData])
          .select();

        if (error) throw error;
        toast.success("Ajuste registrado com sucesso");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar ajuste");
    } finally {
      setLoading(false);
    }
  };

  const difference = formData.physical_stock - formData.system_stock;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adjustment_date">Data do Ajuste *</Label>
          <Input
            id="adjustment_date"
            type="date"
            value={formData.adjustment_date}
            onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
            required
          />
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
          <Label htmlFor="system_stock">Stock no Sistema</Label>
          <Input
            id="system_stock"
            type="number"
            step="0.01"
            value={formData.system_stock}
            onChange={(e) => setFormData({ ...formData, system_stock: parseFloat(e.target.value) || 0 })}
            disabled={!adjustment && formData.part_id !== ""}
          />
          {!adjustment && formData.part_id && (
            <p className="text-xs text-muted-foreground">
              Stock atual: {currentStock.toFixed(2)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="physical_stock">Stock Físico (Contado) *</Label>
          <Input
            id="physical_stock"
            type="number"
            step="0.01"
            value={formData.physical_stock}
            onChange={(e) => setFormData({ ...formData, physical_stock: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo *</Label>
          <Select
            value={formData.reason}
            onValueChange={(value) => setFormData({ ...formData, reason: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physical_count">Contagem Física</SelectItem>
              <SelectItem value="loss">Perda</SelectItem>
              <SelectItem value="theft">Roubo</SelectItem>
              <SelectItem value="damage">Danificação</SelectItem>
              <SelectItem value="registration_error">Erro de Registo</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="applied">Aplicado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium">Diferença:</span>
          <span className={`text-2xl font-bold ${difference >= 0 ? "text-green-600" : "text-red-600"}`}>
            {difference >= 0 ? "+" : ""}{difference.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason_description">Descrição do Motivo</Label>
        <Textarea
          id="reason_description"
          value={formData.reason_description}
          onChange={(e) => setFormData({ ...formData, reason_description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : adjustment ? "Atualizar" : "Registrar Ajuste"}
        </Button>
      </div>
    </form>
  );
};
