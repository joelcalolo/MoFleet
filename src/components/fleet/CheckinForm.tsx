import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Reservation } from "@/pages/Reservations";
import { 
  formatAngolaDate, 
  parseAngolaDate, 
  calculateRentalDays,
  calculateExtraDays,
  getExpectedReturnDateTime,
  formatDateTimeLocal,
  parseDateTimeLocal
} from "@/lib/dateUtils";
import { format, isValid } from "date-fns";
import { handleError, logError } from "@/lib/errorHandler";

interface CheckinFormProps {
  reservation: Reservation;
  checkout: {
    id: string;
    checkout_date: string; // Adicionar este campo
    initial_km: number;
    delivered_by: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckinForm = ({ reservation, checkout, onClose, onSuccess }: CheckinFormProps) => {
  const [loading, setLoading] = useState(false);
  
  // Inicializar com data/hora atual
  const now = new Date();
  const [formData, setFormData] = useState({
    checkin_datetime: formatDateTimeLocal(now), // Campo de data/hora
    final_km: "",
    received_by: "",
    deposit_returned: false,
    deposit_returned_amount: "",
    fines_amount: "",
    extra_fees_amount: "",
    notes: "",
  });

  const [extraDays, setExtraDays] = useState(0);
  const [extraDaysAmount, setExtraDaysAmount] = useState(0);
  const [expectedReturnDateTime, setExpectedReturnDateTime] = useState<Date | null>(null);
  const [extraKmInfo, setExtraKmInfo] = useState<{
    kmPercorridos: number;
    plafondTotal: number;
    kmExtras: number;
    multa: number;
  } | null>(null);

  // Calcular dias extras quando a data/hora do checkin mudar
  useEffect(() => {
    if (checkout.checkout_date && formData.checkin_datetime) {
      const checkoutDate = new Date(checkout.checkout_date);
      const checkinDate = parseDateTimeLocal(formData.checkin_datetime);
      
      // Calcular dias esperados da reserva
      const start = parseAngolaDate(reservation.start_date);
      const end = parseAngolaDate(reservation.end_date);
      const expectedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      // Calcular dias reais de aluguel
      const actualDays = calculateRentalDays(checkoutDate, checkinDate, expectedDays);

      // Calcular data/hora esperada de retorno
      const expectedReturn = getExpectedReturnDateTime(checkoutDate, expectedDays);
      setExpectedReturnDateTime(expectedReturn);
      
      // Verificar se já passou da hora esperada
      if (checkinDate > expectedReturn) {
        const days = calculateExtraDays(checkoutDate, checkinDate, expectedDays);
        setExtraDays(days);
        
        // Calcular valor dos dias extras
        const car = reservation.cars;
        if (car && days > 0) {
          let dailyRate = 0;
          if (reservation.location_type === "city") {
            dailyRate = reservation.with_driver 
              ? (car.price_city_with_driver || 0)
              : (car.price_city_without_driver || 0);
          } else {
            dailyRate = reservation.with_driver 
              ? (car.price_outside_with_driver || 0)
              : (car.price_outside_without_driver || 0);
          }
          const calculatedAmount = dailyRate * days;
          setExtraDaysAmount(isNaN(calculatedAmount) ? 0 : calculatedAmount);
        } else {
          setExtraDaysAmount(0);
        }
      } else {
        setExtraDays(0);
        setExtraDaysAmount(0);
      }

      // Calcular informações de km extras
      const car = reservation.cars;
      if (formData.final_km && checkout.initial_km && car && car.daily_km_limit && car.extra_km_price) {
        const kmPercorridos = parseInt(formData.final_km) - checkout.initial_km;
        const plafondTotal = actualDays * car.daily_km_limit;
        
        if (kmPercorridos > plafondTotal) {
          const kmExtras = kmPercorridos - plafondTotal;
          const multa = kmExtras * car.extra_km_price;
          setExtraKmInfo({
            kmPercorridos,
            plafondTotal,
            kmExtras,
            multa,
          });
        } else {
          setExtraKmInfo(null);
        }
      } else {
        setExtraKmInfo(null);
      }
    }
  }, [checkout.checkout_date, checkout.initial_km, formData.checkin_datetime, formData.final_km, reservation]);

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

    setLoading(true);

    try {
      if (!checkout.checkout_date) {
        toast.error("Erro: Data de checkout não encontrada");
        setLoading(false);
        return;
      }

      // Converter a data/hora informada para ISO string
      const checkinDateTime = parseDateTimeLocal(formData.checkin_datetime);
      const checkoutDate = new Date(checkout.checkout_date);
      
      // Calcular dias reais baseado na hora do checkin
      const start = parseAngolaDate(reservation.start_date);
      const end = parseAngolaDate(reservation.end_date);
      const expectedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const actualDays = calculateRentalDays(checkoutDate, checkinDateTime, expectedDays);
      const daysDifference = actualDays - expectedDays;

      // Calcular multa por km extra
      let extraKmFine = 0;
      const kmPercorridos = parseInt(formData.final_km) - checkout.initial_km;
      const car = reservation.cars;
      
      if (car && car.daily_km_limit && car.extra_km_price) {
        // Plafond total = dias de aluguel * plafond diário
        const plafondTotal = actualDays * car.daily_km_limit;
        
        // Se excedeu o plafond, calcular multa
        if (kmPercorridos > plafondTotal) {
          const kmExtras = kmPercorridos - plafondTotal;
          extraKmFine = kmExtras * car.extra_km_price;
        }
      }

      // Obter usuário autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Criar checkin com a data/hora informada
      const checkinData: any = {
        reservation_id: reservation.id,
        checkin_date: checkinDateTime.toISOString(), // Usar a data/hora informada
        final_km: parseInt(formData.final_km),
        received_by: formData.received_by,
        deposit_returned: formData.deposit_returned,
        deposit_returned_amount: formData.deposit_returned ? parseFloat(formData.deposit_returned_amount) : 0,
        fines_amount: (parseFloat(formData.fines_amount) || 0) + extraKmFine,
        extra_fees_amount: parseFloat(formData.extra_fees_amount) || 0,
        notes: formData.notes || null,
      };

      // Registrar quem fez a ação (auditoria)
      if (authUser) {
        checkinData.created_by_user_id = authUser.id;
      }

      // Se houver dias extras, adicionar ao extra_fees_amount
      if (daysDifference > 0) {
        const car = reservation.cars;
        if (car) {
          let dailyRate = 0;
          if (reservation.location_type === "city") {
            dailyRate = reservation.with_driver 
              ? (car.price_city_with_driver || 0)
              : (car.price_city_without_driver || 0);
          } else {
            dailyRate = reservation.with_driver 
              ? (car.price_outside_with_driver || 0)
              : (car.price_outside_without_driver || 0);
          }
          const extraDaysCost = dailyRate * daysDifference;
          if (!isNaN(extraDaysCost) && extraDaysCost > 0) {
            checkinData.extra_fees_amount = (parseFloat(formData.extra_fees_amount) || 0) + extraDaysCost;
            
            // Adicionar nota sobre dias extras
            const extraDaysNote = `Dias extras: ${daysDifference} dia(s) - ${extraDaysCost.toFixed(2)} AKZ`;
            checkinData.notes = formData.notes 
              ? `${formData.notes}\n${extraDaysNote}` 
              : extraDaysNote;
          }
        }
      }

      // Adicionar nota sobre multa de km extra se houver
      if (extraKmFine > 0 && car) {
        const plafondTotal = actualDays * (car.daily_km_limit || 0);
        const kmExtras = kmPercorridos - plafondTotal;
        const kmNote = `Multa por KM extra: ${kmExtras} km excedidos - ${extraKmFine.toFixed(2)} AKZ (Plafond: ${plafondTotal} km, Percorridos: ${kmPercorridos} km)`;
        checkinData.notes = checkinData.notes 
          ? `${checkinData.notes}\n${kmNote}` 
          : kmNote;
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
          <Label>Data/Hora de Saída</Label>
          <div className="p-2 border rounded-md bg-muted">
            {checkout.checkout_date 
              ? format(new Date(checkout.checkout_date), "dd/MM/yyyy HH:mm")
              : "N/A"}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkin_datetime">Data e Hora do Retorno *</Label>
          <Input
            id="checkin_datetime"
            type="datetime-local"
            value={formData.checkin_datetime}
            onChange={(e) => setFormData({ ...formData, checkin_datetime: e.target.value })}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Informe a data e hora real em que o carro foi retornado
          </p>
        </div>
      </div>

      {expectedReturnDateTime && isValid(expectedReturnDateTime) && (
        <div className="p-2 border rounded-md bg-blue-50">
          <div className="text-sm">
            <span className="font-medium">Retorno esperado: </span>
            <span>{format(expectedReturnDateTime, "dd/MM/yyyy HH:mm")}</span>
          </div>
        </div>
      )}

      {extraDays > 0 && (
        <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
          <div className="text-sm font-medium text-yellow-800">
            ⚠️ Atenção: Retorno após o horário previsto
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            Dias extras: {extraDays} dia(s)
          </div>
          <div className="text-sm text-yellow-700">
            Valor adicional: {extraDaysAmount.toFixed(2)} AKZ
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Este valor será adicionado automaticamente às taxas extras
          </div>
        </div>
      )}

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

      {extraKmInfo && extraKmInfo.kmExtras > 0 && (
        <div className="p-3 border rounded-md bg-red-50 border-red-200">
          <div className="text-sm font-medium text-red-800">
            ⚠️ Atenção: Quilometragem excedeu o plafond
          </div>
          <div className="text-sm text-red-700 mt-1 space-y-1">
            <div>KM percorridos: {extraKmInfo.kmPercorridos.toLocaleString()} km</div>
            <div>Plafond permitido: {extraKmInfo.plafondTotal.toLocaleString()} km</div>
            <div>KM extras: {extraKmInfo.kmExtras.toLocaleString()} km</div>
            <div className="font-semibold">Multa por KM extra: {extraKmInfo.multa.toFixed(2)} AKZ</div>
          </div>
          <div className="text-xs text-red-600 mt-1">
            Esta multa será adicionada automaticamente às multas
          </div>
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

