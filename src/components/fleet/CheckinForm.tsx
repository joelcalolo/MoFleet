import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Reservation } from "@/pages/Reservations";
import { useCompany } from "@/hooks/useCompany";
import { formatAngolaDate } from "@/lib/dateUtils";
import { handleError, logError } from "@/lib/errorHandler";

interface CheckinFormProps {
  reservation: Reservation;
  checkout: {
    id: string;
    initial_km: number;
    delivered_by: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckinForm = ({ reservation, checkout, onClose, onSuccess }: CheckinFormProps) => {
  const [loading, setLoading] = useState(false);
  const { companyId } = useCompany();
  const [formData, setFormData] = useState({
    final_km: "",
    received_by: "",
    deposit_returned: false,
    deposit_returned_amount: "",
    fines_amount: "",
    extra_fees_amount: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.final_km || !formData.received_by) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (formData.deposit_returned && (!formData.deposit_returned_amount || parseFloat(formData.deposit_returned_amount) <= 0)) {
      toast.error("Informe o valor da caução devolvida");
      return;
    }

    if (!companyId) {
      toast.error("Erro: Empresa não encontrada");
      return;
    }

    setLoading(true);

    try {
      // Criar checkin
      const checkinData: any = {
        reservation_id: reservation.id,
        final_km: parseInt(formData.final_km),
        received_by: formData.received_by,
        deposit_returned: formData.deposit_returned,
        deposit_returned_amount: formData.deposit_returned ? parseFloat(formData.deposit_returned_amount) : 0,
        fines_amount: parseFloat(formData.fines_amount) || 0,
        extra_fees_amount: parseFloat(formData.extra_fees_amount) || 0,
        notes: formData.notes || null,
      };

      // Adicionar company_id apenas se disponível (após migration)
      if (companyId) {
        checkinData.company_id = companyId;
      }

      const { error: checkinError } = await supabase
        .from("checkins")
        .insert([checkinData]);

      if (checkinError) {
        // Se o erro for sobre company_id não existir, informar sobre a migration
        if (checkinError.message.includes("company_id")) {
          throw new Error("A migration para adicionar company_id não foi executada. Por favor, execute a migration 20250115000003_update_checkouts_checkins.sql");
        }
        throw checkinError;
      }

      // Atualizar status da reserva para "completed"
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ status: "completed" })
        .eq("id", reservation.id);

      if (reservationError) {
        console.error("Error updating reservation status:", reservationError);
        // Não falhar o checkin se houver erro ao atualizar status da reserva
        // O checkin já foi registrado com sucesso
      }

      // Marcar carro como disponível novamente
      const { error: carError } = await supabase
        .from("cars")
        .update({ is_available: true })
        .eq("id", reservation.car_id);

      if (carError) {
        console.error("Error updating car availability:", carError);
        // Não falhar o checkin se houver erro ao atualizar disponibilidade
      }

      // Se chegou aqui, o checkin foi registrado com sucesso
      toast.success("Retorno do carro registrado com sucesso");
      onSuccess();
      onClose();
    } catch (error: any) {
      logError(error, "CheckinForm");
      const errorMessage = handleError(error, "Erro ao registrar retorno do carro");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const kmDifference = formData.final_km && checkout.initial_km 
    ? parseInt(formData.final_km) - checkout.initial_km 
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Reserva</Label>
        <div className="p-3 border rounded-md bg-muted">
          <div className="font-medium">
            {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "N/A"}
          </div>
          <div className="text-sm text-muted-foreground">
            Cliente: {reservation.customers?.name || "N/A"}
          </div>
          <div className="text-sm text-muted-foreground">
            Período: {formatAngolaDate(reservation.start_date)} - {formatAngolaDate(reservation.end_date)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quilometragem Inicial</Label>
          <div className="p-2 border rounded-md bg-muted">
            {checkout.initial_km.toLocaleString()} km
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="final_km">Quilometragem Final *</Label>
          <Input
            id="final_km"
            type="number"
            min={checkout.initial_km}
            value={formData.final_km}
            onChange={(e) => setFormData({ ...formData, final_km: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      </div>

      {kmDifference !== null && (
        <div className="p-2 border rounded-md bg-blue-50">
          <span className="text-sm font-medium">Quilometragem percorrida: {kmDifference.toLocaleString()} km</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="received_by">Quem Recebeu o Carro *</Label>
        <Input
          id="received_by"
          type="text"
          placeholder="Nome da pessoa que recebeu"
          value={formData.received_by}
          onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="deposit_returned"
            checked={formData.deposit_returned}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, deposit_returned: checked as boolean })
            }
            disabled={loading}
          />
          <Label htmlFor="deposit_returned" className="cursor-pointer">
            Caução Devolvida
          </Label>
        </div>
      </div>

      {formData.deposit_returned && (
        <div className="space-y-2">
          <Label htmlFor="deposit_returned_amount">Valor da Caução Devolvida (AKZ) *</Label>
          <Input
            id="deposit_returned_amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.deposit_returned_amount}
            onChange={(e) => setFormData({ ...formData, deposit_returned_amount: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fines_amount">Multas (AKZ)</Label>
          <Input
            id="fines_amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.fines_amount}
            onChange={(e) => setFormData({ ...formData, fines_amount: e.target.value })}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="extra_fees_amount">Taxas Extras (AKZ)</Label>
          <Input
            id="extra_fees_amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.extra_fees_amount}
            onChange={(e) => setFormData({ ...formData, extra_fees_amount: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrar Retorno"}
        </Button>
      </div>
    </form>
  );
};

