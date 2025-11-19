import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Reservation } from "@/pages/Reservations";
import { Car } from "@/pages/Cars";
import { Customer } from "@/pages/Customers";
import { parseAngolaDate, formatAngolaDate } from "@/lib/dateUtils";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyUser } from "@/contexts/CompanyUserContext";
import { handleError, logError } from "@/lib/errorHandler";

interface ReservationFormProps {
  reservation: Reservation | null;
  onClose: () => void;
}

export const ReservationForm = ({ reservation, onClose }: ReservationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const { companyId } = useCompany();
  const { companyUser } = useCompanyUser();
  
  const [formData, setFormData] = useState({
    car_id: reservation?.car_id || "",
    customer_id: reservation?.customer_id || "",
    start_date: reservation?.start_date || "",
    end_date: reservation?.end_date || "",
    location_type: (reservation?.location_type as "city" | "outside") || "city",
    with_driver: reservation?.with_driver || false,
    with_delivery: (reservation as any)?.with_delivery ?? true,
    with_pickup: (reservation as any)?.with_pickup ?? true,
    total_amount: reservation?.total_amount || 0,
    status: (reservation?.status as any) || "pending",
    deposit_paid: reservation?.deposit_paid || false,
    notes: reservation?.notes || "",
    created_by: reservation?.created_by || "",
  });

  useEffect(() => {
    fetchCarsAndCustomers();
  }, []);

  useEffect(() => {
    if (formData.car_id && formData.start_date && formData.end_date) {
      calculateTotal();
    }
  }, [formData.car_id, formData.start_date, formData.end_date, formData.location_type, formData.with_driver, formData.with_delivery, formData.with_pickup]);

  const fetchCarsAndCustomers = async () => {
    const [carsRes, customersRes] = await Promise.all([
      supabase.from("cars").select("*").eq("is_available", true),
      supabase.from("customers").select("*").eq("is_active", true),
    ]);

    setCars(carsRes.data || []);
    setCustomers(customersRes.data || []);
    
    if (reservation) {
      const car = carsRes.data?.find(c => c.id === reservation.car_id);
      setSelectedCar(car || null);
    }
  };

  // Função para verificar sobreposição de reservas
  const checkOverlap = async (carId: string, startDate: string, endDate: string, excludeId?: string): Promise<{ hasOverlap: boolean; overlappingReservation?: any }> => {
    if (!carId || !startDate || !endDate) {
      return { hasOverlap: false };
    }

    // Buscar todas as reservas ativas do carro (exceto canceladas e a reserva atual se estiver editando)
    const query = supabase
      .from("reservations")
      .select("id, start_date, end_date, status, cars(brand, model), customers(name)")
      .eq("car_id", carId)
      .neq("status", "cancelled");

    if (excludeId) {
      query.neq("id", excludeId);
    }

    const { data: existingReservations, error } = await query;

    if (error) {
      console.error("Error checking overlaps:", error);
      return { hasOverlap: false };
    }

    if (!existingReservations || existingReservations.length === 0) {
      return { hasOverlap: false };
    }

    const newStart = parseAngolaDate(startDate);
    const newEnd = parseAngolaDate(endDate);

    // Verificar sobreposição: dois intervalos se sobrepõem se start1 <= end2 AND start2 <= end1
    for (const existing of existingReservations) {
      const existingStart = parseAngolaDate(existing.start_date);
      const existingEnd = parseAngolaDate(existing.end_date);

      // Verificar se há sobreposição
      if (newStart <= existingEnd && existingStart <= newEnd) {
        return {
          hasOverlap: true,
          overlappingReservation: existing,
        };
      }
    }

    return { hasOverlap: false };
  };

  const calculateTotal = async () => {
    const car = cars.find(c => c.id === formData.car_id);
    if (!car) {
      setOverlapError(null);
      return;
    }

    setSelectedCar(car);

    const start = parseAngolaDate(formData.start_date);
    const end = parseAngolaDate(formData.end_date);
    // Adiciona 1 dia ao cálculo para incluir o primeiro dia
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      toast.error("A data de fim deve ser posterior à data de início");
      setOverlapError("A data de fim deve ser posterior à data de início");
      return;
    }

    // Verificar sobreposição
    const overlapCheck = await checkOverlap(
      formData.car_id,
      formData.start_date,
      formData.end_date,
      reservation?.id
    );

    if (overlapCheck.hasOverlap && overlapCheck.overlappingReservation) {
      const overlap = overlapCheck.overlappingReservation;
      const carName = overlap.cars 
        ? `${overlap.cars.brand} ${overlap.cars.model}` 
        : "este carro";
      const customerName = overlap.customers?.name || "N/A";
      const overlapPeriod = `${formatAngolaDate(overlap.start_date)} - ${formatAngolaDate(overlap.end_date)}`;
      
      const errorMsg = `Este carro já está reservado no período selecionado!\n\nReserva existente:\n• ${carName}\n• Cliente: ${customerName}\n• Período: ${overlapPeriod}`;
      
      setOverlapError(errorMsg);
      toast.error("Este carro já tem reservas neste período!");
      return;
    }

    setOverlapError(null);

    let dailyRate = 0;
    if (formData.location_type === "city") {
      dailyRate = formData.with_driver ? car.price_city_with_driver : car.price_city_without_driver;
    } else {
      dailyRate = formData.with_driver ? car.price_outside_with_driver : car.price_outside_without_driver;
    }

    // Calcular taxas apenas se selecionadas
    const deliveryFee = formData.with_delivery ? (car.delivery_fee || 0) : 0;
    const pickupFee = formData.with_pickup ? (car.pickup_fee || 0) : 0;

    const total = (dailyRate * days) + deliveryFee + pickupFee;
    setFormData({ ...formData, total_amount: total });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação final de sobreposição antes de salvar
      const overlapCheck = await checkOverlap(
        formData.car_id,
        formData.start_date,
        formData.end_date,
        reservation?.id
      );

      if (overlapCheck.hasOverlap && overlapCheck.overlappingReservation) {
        const overlap = overlapCheck.overlappingReservation;
        const carName = overlap.cars 
          ? `${overlap.cars.brand} ${overlap.cars.model}` 
          : "este carro";
        const customerName = overlap.customers?.name || "N/A";
        const overlapPeriod = `${formatAngolaDate(overlap.start_date)} - ${formatAngolaDate(overlap.end_date)}`;
        
        toast.error(`Não é possível salvar: Este carro já está reservado no período selecionado!\n\nReserva existente:\n• Cliente: ${customerName}\n• Período: ${overlapPeriod}`);
        setOverlapError(`Este carro já está reservado no período selecionado!\n\nReserva existente:\n• Cliente: ${customerName}\n• Período: ${overlapPeriod}`);
        setLoading(false);
        return;
      }

      // Obter usuário autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Preparar dados para salvar, removendo campos que podem não existir no banco ainda
      const dataToSave: any = {
        car_id: formData.car_id,
        customer_id: formData.customer_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location_type: formData.location_type,
        with_driver: formData.with_driver,
        total_amount: formData.total_amount,
        status: formData.status,
        deposit_paid: formData.deposit_paid,
        notes: formData.notes || null,
        created_by: formData.created_by || null,
      };

      // Registrar quem fez a ação (auditoria) - apenas ao criar nova reserva
      if (!reservation) {
        if (companyUser) {
          dataToSave.created_by_company_user_id = companyUser.id;
        } else if (authUser) {
          dataToSave.created_by_user_id = authUser.id;
        }
      }

      // Adicionar campos opcionais apenas se a migration foi aplicada
      // Tentar adicionar, mas não falhar se não existirem
      if (formData.with_delivery !== undefined) {
        dataToSave.with_delivery = formData.with_delivery;
      }
      if (formData.with_pickup !== undefined) {
        dataToSave.with_pickup = formData.with_pickup;
      }

      if (reservation) {
        const { error } = await supabase
          .from("reservations")
          .update(dataToSave)
          .eq("id", reservation.id);

        if (error) {
          // Se o erro for sobre colunas que não existem, tentar novamente sem elas
          if (error.message.includes("with_delivery") || error.message.includes("with_pickup")) {
            delete dataToSave.with_delivery;
            delete dataToSave.with_pickup;
            const { error: retryError } = await supabase
              .from("reservations")
              .update(dataToSave)
              .eq("id", reservation.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        toast.success("Reserva atualizada com sucesso");
      } else {
        if (!companyId) {
          toast.error("Erro: Empresa não encontrada");
          setLoading(false);
          return;
        }

        const { error } = await supabase.from("reservations").insert([{ ...dataToSave, company_id: companyId }]);

        if (error) {
          // Se o erro for sobre colunas que não existem, tentar novamente sem elas
          if (error.message.includes("with_delivery") || error.message.includes("with_pickup")) {
            delete dataToSave.with_delivery;
            delete dataToSave.with_pickup;
            const { error: retryError } = await supabase
              .from("reservations")
              .insert([{ ...dataToSave, company_id: companyId }]);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        toast.success("Reserva criada com sucesso");
      }

      onClose();
    } catch (error: any) {
      logError(error, "ReservationForm");
      const errorMessage = handleError(error, "Erro ao salvar reserva");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="car_id">Carro *</Label>
          <Select
            value={formData.car_id}
            onValueChange={(value) => setFormData({ ...formData, car_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um carro" />
            </SelectTrigger>
            <SelectContent>
              {cars.map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.brand} {car.model} - {car.license_plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_id">Cliente *</Label>
          <Select
            value={formData.customer_id}
            onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">Data de Início *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Data de Fim *</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location_type">Local de Uso *</Label>
          <Select
            value={formData.location_type}
            onValueChange={(value: "city" | "outside") =>
              setFormData({ ...formData, location_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="city">Dentro da Cidade</SelectItem>
              <SelectItem value="outside">Fora da Cidade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="active">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="created_by">Criado Por</Label>
          <Input
            id="created_by"
            type="text"
            value={formData.created_by}
            onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
            placeholder="Nome do funcionário que criou a reserva"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="with_driver"
              checked={formData.with_driver}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, with_driver: checked as boolean })
              }
            />
            <Label htmlFor="with_driver" className="cursor-pointer">
              Com Motorista
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="with_delivery"
              checked={formData.with_delivery}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, with_delivery: checked as boolean })
              }
            />
            <Label htmlFor="with_delivery" className="cursor-pointer">
              Entrega
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="with_pickup"
              checked={formData.with_pickup}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, with_pickup: checked as boolean })
              }
            />
            <Label htmlFor="with_pickup" className="cursor-pointer">
              Recolha
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="deposit_paid"
              checked={formData.deposit_paid}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, deposit_paid: checked as boolean })
              }
            />
            <Label htmlFor="deposit_paid" className="cursor-pointer">
              Caução Paga
            </Label>
          </div>
        </div>
      </div>

      {overlapError && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-destructive">⚠️ Conflito de Reserva</h3>
          <div className="text-sm text-destructive whitespace-pre-line">
            {overlapError}
          </div>
        </div>
      )}

      {selectedCar && !overlapError && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Detalhes do Cálculo</h3>
          <div className="text-sm space-y-1">
            {formData.with_delivery && (
              <p>Taxa de Entrega: {selectedCar.delivery_fee?.toFixed(2) || "0.00"} AKZ</p>
            )}
            {formData.with_pickup && (
              <p>Taxa de Recolha: {selectedCar.pickup_fee?.toFixed(2) || "0.00"} AKZ</p>
            )}
            {!formData.with_delivery && !formData.with_pickup && (
              <p className="text-muted-foreground italic">Nenhuma taxa de serviço selecionada</p>
            )}
            <p>Caução Necessária: {selectedCar.deposit_amount?.toFixed(2)} AKZ</p>
            <p className="font-bold mt-2 text-base">
              Total: {formData.total_amount.toFixed(2)} AKZ
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !!overlapError}>
          {loading ? "Salvando..." : reservation ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};