import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Part } from "./PartForm";

export interface StockExit {
  id: string;
  exit_number: string;
  exit_date: string;
  part_id: string;
  quantity: number;
  car_id?: string;
  car_mileage?: number;
  requested_by?: string;
  requested_by_name?: string;
  delivered_by?: string;
  delivered_by_name?: string;
  exit_type: string;
  reason?: string;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface StockExitFormProps {
  exit: StockExit | null;
  onClose: () => void;
}

export const StockExitForm = ({ exit, onClose }: StockExitFormProps) => {
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [cars, setCars] = useState<Array<{ id: string; license_plate: string; brand: string; model: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [formData, setFormData] = useState({
    exit_date: exit?.exit_date || new Date().toISOString().split("T")[0],
    part_id: exit?.part_id || "",
    quantity: exit?.quantity || 0,
    car_id: exit?.car_id || "",
    car_mileage: exit?.car_mileage || 0,
    requested_by: exit?.requested_by || "",
    requested_by_name: exit?.requested_by_name || "",
    delivered_by: exit?.delivered_by || "",
    delivered_by_name: exit?.delivered_by_name || "",
    exit_type: exit?.exit_type || "other",
    reason: exit?.reason || "",
    status: exit?.status || "delivered", // Padrão: delivered (entregue automaticamente)
    notes: exit?.notes || "",
  });

  useEffect(() => {
    fetchParts();
    fetchCars();
    fetchUsers();
  }, []);

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

  const fetchCars = async () => {
    try {
      const { data } = await supabase
        .from("cars")
        .select("id, license_plate, brand, model")
        .order("license_plate");
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsers([{ id: user.id, email: user.email || "" }]);
        if (!exit) {
          setFormData(prev => ({
            ...prev,
            requested_by: user.id,
            delivered_by: user.id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const submitData = {
        ...formData,
        requested_by: user?.id || null,
        delivered_by: user?.id || null,
      };

      if (exit) {
        const { error } = await supabase
          .from("stock_exits")
          .update(submitData)
          .eq("id", exit.id);

        if (error) throw error;
        toast.success("Saída atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from("stock_exits")
          .insert([submitData])
          .select();

        if (error) throw error;
        toast.success("Requisição registrada com sucesso");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar saída");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="exit_date">Data da Saída *</Label>
          <Input
            id="exit_date"
            type="date"
            value={formData.exit_date}
            onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
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
          <Label htmlFor="car_id">Viatura (opcional)</Label>
          <Select
            value={formData.car_id || "none"}
            onValueChange={(value) => {
              setFormData({ 
                ...formData, 
                car_id: value === "none" ? "" : value 
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma viatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {cars.map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.brand} {car.model} - {car.license_plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.car_id && (
          <div className="space-y-2">
            <Label htmlFor="car_mileage">Quilometragem da Viatura</Label>
            <Input
              id="car_mileage"
              type="number"
              step="0.01"
              min="0"
              value={formData.car_mileage}
              onChange={(e) => setFormData({ ...formData, car_mileage: parseFloat(e.target.value) || 0 })}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="exit_type">Tipo de Saída *</Label>
          <Select
            value={formData.exit_type}
            onValueChange={(value) => setFormData({ ...formData, exit_type: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preventive_maintenance">Manutenção Preventiva</SelectItem>
              <SelectItem value="corrective_maintenance">Manutenção Corretiva</SelectItem>
              <SelectItem value="urgent_repair">Reparação Urgente</SelectItem>
              <SelectItem value="internal_use">Uso Interno</SelectItem>
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
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requested_by_name">Quem Requisitou *</Label>
          <Input
            id="requested_by_name"
            value={formData.requested_by_name}
            onChange={(e) => setFormData({ ...formData, requested_by_name: e.target.value })}
            placeholder="Nome da pessoa que requisitou a peça"
            required
          />
          <p className="text-xs text-muted-foreground">
            Nome da pessoa física que requisitou (pode não ser usuário do sistema)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivered_by_name">Quem Entregou/Retirou *</Label>
          <Input
            id="delivered_by_name"
            value={formData.delivered_by_name}
            onChange={(e) => setFormData({ ...formData, delivered_by_name: e.target.value })}
            placeholder="Nome da pessoa que entregou/retirou a peça"
            required
          />
          <p className="text-xs text-muted-foreground">
            Nome da pessoa física que entregou/retirou (pode não ser usuário do sistema)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo/Descrição</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows={3}
          placeholder="Descreva o problema ou motivo da requisição"
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
          {loading ? "Salvando..." : exit ? "Atualizar" : "Registrar Saída"}
        </Button>
      </div>
    </form>
  );
};
