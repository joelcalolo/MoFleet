import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Reservation } from "@/pages/Reservations";
import { useCompany } from "@/hooks/useCompany";
import { formatAngolaDate } from "@/lib/dateUtils";
import { handleError, logError } from "@/lib/errorHandler";

interface CheckoutFormProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutForm = ({ reservation, onClose, onSuccess }: CheckoutFormProps) => {
  const [loading, setLoading] = useState(false);
  const { companyId } = useCompany();
  const [formData, setFormData] = useState({
    initial_km: "",
    delivered_by: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.initial_km || !formData.delivered_by) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!companyId) {
      toast.error("Erro: Empresa não encontrada");
      return;
    }

    setLoading(true);

    try {
      // Criar checkout
      const checkoutData: any = {
        reservation_id: reservation.id,
        initial_km: parseInt(formData.initial_km),
        delivered_by: formData.delivered_by,
        notes: formData.notes || null,
      };

      // Adicionar company_id se disponível (após migration)
      // Se não tiver company_id, a política RLS verificará através da reserva
      if (companyId) {
        checkoutData.company_id = companyId;
      }

      const { error: checkoutError } = await supabase
        .from("checkouts")
        .insert([checkoutData]);

      if (checkoutError) {
        // Se o erro for sobre permissão, tentar sem company_id (a política verificará pela reserva)
        if (checkoutError.message.includes("permission") || checkoutError.message.includes("row-level security") || checkoutError.message.includes("policy")) {
          // Tentar novamente sem company_id - a política RLS verificará através da reserva
          delete checkoutData.company_id;
          const { error: retryError } = await supabase
            .from("checkouts")
            .insert([checkoutData]);
          if (retryError) throw retryError;
        } else if (checkoutError.message.includes("company_id")) {
          throw new Error("A migration para adicionar company_id não foi executada. Por favor, execute a migration 20250115000003_update_checkouts_checkins.sql");
        } else {
          throw checkoutError;
        }
      }

      // Atualizar status da reserva para "active"
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ status: "active" })
        .eq("id", reservation.id);

      if (reservationError) {
        console.error("Error updating reservation status:", reservationError);
        // Não falhar o checkout se houver erro ao atualizar status da reserva
        // O checkout já foi registrado com sucesso
      }

      // Marcar carro como indisponível
      const { error: carError } = await supabase
        .from("cars")
        .update({ is_available: false })
        .eq("id", reservation.car_id);

      if (carError) {
        console.error("Error updating car availability:", carError);
        // Não falhar o checkout se houver erro ao atualizar disponibilidade
      }

      // Se chegou aqui, o checkout foi registrado com sucesso
      toast.success("Saída do carro registrada com sucesso");
      onSuccess();
      onClose();
    } catch (error: any) {
      logError(error, "CheckoutForm");
      const errorMessage = handleError(error, "Erro ao registrar saída do carro");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="space-y-2">
        <Label htmlFor="initial_km">Quilometragem Inicial *</Label>
        <Input
          id="initial_km"
          type="number"
          min="0"
          value={formData.initial_km}
          onChange={(e) => setFormData({ ...formData, initial_km: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivered_by">Quem Entregou o Carro *</Label>
        <Input
          id="delivered_by"
          type="text"
          placeholder="Nome da pessoa que entregou"
          value={formData.delivered_by}
          onChange={(e) => setFormData({ ...formData, delivered_by: e.target.value })}
          required
          disabled={loading}
        />
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
          {loading ? "Registrando..." : "Registrar Saída"}
        </Button>
      </div>
    </form>
  );
};

