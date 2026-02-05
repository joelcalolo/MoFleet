import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { ReservationList } from "@/components/reservations/ReservationList";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, startOfDay, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseAngolaDate, getAngolaDate, formatAngolaDate, isSameAngolaDay } from "@/lib/dateUtils";
import { useCompany } from "@/hooks/useCompany";

export interface Reservation {
  id: string;
  car_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  location_type: "city" | "outside";
  with_driver: boolean;
  total_amount: number;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  deposit_paid: boolean;
  notes?: string;
  created_by?: string;
  cars?: { 
    brand: string; 
    model: string; 
    license_plate: string;
    price_city_with_driver?: number;
    price_city_without_driver?: number;
    price_outside_with_driver?: number;
    price_outside_without_driver?: number;
    daily_km_limit?: number;
    extra_km_price?: number;
  };
  customers?: { name: string; phone: string };
}

// Paleta de cores para os carros
const CAR_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-600", text: "text-blue-700", light: "bg-blue-100" },
  { bg: "bg-green-500", border: "border-green-600", text: "text-green-700", light: "bg-green-100" },
  { bg: "bg-red-500", border: "border-red-600", text: "text-red-700", light: "bg-red-100" },
  { bg: "bg-yellow-500", border: "border-yellow-600", text: "text-yellow-700", light: "bg-yellow-100" },
  { bg: "bg-purple-500", border: "border-purple-600", text: "text-purple-700", light: "bg-purple-100" },
  { bg: "bg-pink-500", border: "border-pink-600", text: "text-pink-700", light: "bg-pink-100" },
  { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-indigo-700", light: "bg-indigo-100" },
  { bg: "bg-orange-500", border: "border-orange-600", text: "text-orange-700", light: "bg-orange-100" },
  { bg: "bg-teal-500", border: "border-teal-600", text: "text-teal-700", light: "bg-teal-100" },
  { bg: "bg-cyan-500", border: "border-cyan-600", text: "text-cyan-700", light: "bg-cyan-100" },
];

const Reservations = () => {
  const { companyId, loading: companyLoading } = useCompany();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!companyLoading && companyId) {
      fetchReservations();
    }
  }, [companyId, companyLoading]);

  // Verificar se há um ID de reserva na URL para editar
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && reservations.length > 0) {
      const reservation = reservations.find(r => r.id === editId);
      if (reservation) {
        setEditingReservation(reservation);
        setShowForm(true);
        setSearchParams({}); // Limpar o parâmetro da URL
      }
    }
  }, [searchParams, reservations, setSearchParams]);

  const fetchReservations = async () => {
    if (!companyId) {
      console.warn("Reservations: Company ID not available, cannot fetch reservations");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate),
          customers (name, phone)
        `)
        .eq("company_id", companyId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      
      // Filtrar reservas que já têm checkin (não devem aparecer no calendário)
      const reservationsWithCheckin = new Set<string>();
      const reservationsData = data as Reservation[] || [];
      
      for (const reservation of reservationsData) {
        const { data: checkin } = await supabase
          .from("checkins")
          .select("id")
          .eq("reservation_id", reservation.id)
          .maybeSingle();
        
        if (checkin) {
          reservationsWithCheckin.add(reservation.id);
        }
      }
      
      // Remover reservas com checkin da lista
      const filteredReservations = reservationsData.filter(
        r => !reservationsWithCheckin.has(r.id)
      );
      
      setReservations(filteredReservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingReservation(null);
    fetchReservations();
  };

  // Obter todos os carros únicos das reservas e atribuir cores
  const carColorMap = useMemo(() => {
    const map = new Map<string, typeof CAR_COLORS[0] & { carId: string; carName: string }>();
    const activeReservations = reservations.filter(r => r.status !== "cancelled");
    const uniqueCars = new Map<string, { brand: string; model: string; license_plate: string }>();

    activeReservations.forEach(reservation => {
      if (reservation.cars && !uniqueCars.has(reservation.car_id)) {
        uniqueCars.set(reservation.car_id, reservation.cars);
      }
    });

    let colorIndex = 0;
    uniqueCars.forEach((car, carId) => {
      const color = CAR_COLORS[colorIndex % CAR_COLORS.length];
      map.set(carId, {
        ...color,
        carId,
        carName: `${car.brand} ${car.model}`,
      });
      colorIndex++;
    });

    return map;
  }, [reservations]);

  // Obter reservas ativas do mês atual
  const monthReservations = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    return reservations.filter(reservation => {
      if (reservation.status === "cancelled") return false;
      
      const resStart = parseAngolaDate(reservation.start_date);
      const resEnd = parseAngolaDate(reservation.end_date);
      
      // Verificar se a reserva se sobrepõe com o mês atual
      return resEnd >= start && resStart <= end;
    });
  }, [reservations, currentDate]);

  // Obter reservas para um dia específico
  const getReservationsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    return monthReservations.filter(reservation => {
      const start = parseAngolaDate(reservation.start_date);
      const end = parseAngolaDate(reservation.end_date);
      return dayStart >= start && dayStart <= end;
    });
  };

  // Obter todos os dias do mês
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Obter o dia da semana do primeiro dia do mês (0 = Domingo, 1 = Segunda, etc.)
  const firstDayOfWeek = getDay(startOfMonth(currentDate));
  
  // Criar array com células vazias antes do primeiro dia para alinhar o calendário
  const emptyCells = Array(firstDayOfWeek).fill(null);
  const days = [...emptyCells, ...monthDays];

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestão de Reservas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Crie e gerencie reservas de veículos</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Reserva
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingReservation ? "Editar Reserva" : "Nova Reserva"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReservationForm reservation={editingReservation} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Calendário */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <CardTitle className="text-xl sm:text-2xl">Calendário de Reservas</CardTitle>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentDate(addMonths(currentDate, -1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-base sm:text-lg font-semibold min-w-[150px] sm:min-w-[200px] text-center">
                      {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Legenda */}
                  {carColorMap.size > 0 && (
                    <div className="border rounded-lg p-3 sm:p-4">
                      <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Legenda de Cores</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {Array.from(carColorMap.values()).map((carColor) => (
                          <div key={carColor.carId} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${carColor.bg} border ${carColor.border}`} />
                            <span className="text-sm">{carColor.carName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendário */}
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="min-w-[100%] px-4 sm:px-0">
                      {/* Cabeçalho dos dias da semana */}
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                          <div key={day} className="text-center text-[10px] font-semibold py-1">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Grid do calendário */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {days.map((day, dayIndex) => {
                          // Se for uma célula vazia (antes do primeiro dia do mês)
                          if (day === null) {
                            return (
                              <div
                                key={`empty-${dayIndex}`}
                                className="min-h-[50px] border rounded p-0.5 bg-muted/30"
                              />
                            );
                          }

                          const dayReservations = getReservationsForDay(day);
                          const isFirstDay = dayIndex % 7 === 0;
                          const isLastDay = dayIndex % 7 === 6;
                          const isToday = isSameAngolaDay(day, getAngolaDate());
                          
                          return (
                            <div
                              key={day.toISOString()}
                              className={`min-h-[50px] border rounded p-0.5 ${
                                isToday ? "bg-accent/50" : "bg-card"
                              }`}
                            >
                              <div className="text-[10px] font-medium mb-0.5">
                                {format(day, "d")}
                              </div>
                              <div className="space-y-0.5">
                                {dayReservations.map((reservation) => {
                                  const carColor = carColorMap.get(reservation.car_id);
                                  if (!carColor) return null;

                                  const isStart = isSameAngolaDay(day, reservation.start_date);
                                  const isEnd = isSameAngolaDay(day, reservation.end_date);
                                  const isMiddle = !isStart && !isEnd;

                                  return (
                                    <Popover key={reservation.id}>
                                      <PopoverTrigger asChild>
                                        <div
                                          className={`text-[9px] p-0.5 cursor-pointer hover:opacity-80 border ${
                                            carColor.light
                                          } ${carColor.border} ${
                                            isStart ? "rounded-l" : ""
                                          } ${isEnd ? "rounded-r" : ""} ${
                                            isMiddle ? "rounded-none" : ""
                                          }`}
                                          style={{
                                            borderLeftWidth: isStart || isFirstDay ? "1px" : "0",
                                            borderRightWidth: isEnd || isLastDay ? "1px" : "0",
                                            borderTopWidth: "1px",
                                            borderBottomWidth: "1px",
                                          }}
                                        >
                                          <div className="font-medium truncate leading-tight">
                                            {reservation.cars
                                              ? `${reservation.cars.brand} ${reservation.cars.model}`
                                              : "N/A"}
                                          </div>
                                          <div className="text-[7px] text-muted-foreground truncate leading-tight">
                                            {reservation.customers?.name || "N/A"}
                                          </div>
                                        </div>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80">
                                        <div className="space-y-2">
                                          <h4 className="font-semibold text-sm">
                                            {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                                          </h4>
                                          <div className="space-y-2">
                                            <div className="p-2 border rounded text-sm">
                                              <div className="font-medium">
                                                {reservation.cars
                                                  ? `${reservation.cars.brand} ${reservation.cars.model}`
                                                  : "N/A"}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                Cliente: {reservation.customers?.name || "N/A"}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                Período: {formatAngolaDate(reservation.start_date)} -{" "}
                                                {formatAngolaDate(reservation.end_date)}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                Total: {reservation.total_amount.toFixed(2)} AKZ
                                              </div>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleEdit(reservation)}
                                              className="w-full"
                                            >
                                              Editar Reserva
                                            </Button>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Reservas */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <ReservationList
                  reservations={reservations}
                  loading={loading}
                  onEdit={handleEdit}
                  onRefresh={fetchReservations}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reservations;