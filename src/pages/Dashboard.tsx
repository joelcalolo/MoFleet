import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, DollarSign, AlertCircle, ChevronLeft, ChevronRight, Bell, Users, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, startOfDay, isSameDay, differenceInDays, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Reservation } from "@/pages/Reservations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { parseAngolaDate, getAngolaDate, formatAngolaDate, isSameAngolaDay } from "@/lib/dateUtils";

interface Stats {
  activeReservations: number;
  availableCars: number;
  totalCars: number;
  totalRevenue: number;
  upcomingReturns: number;
  totalCustomers: number;
  completedReservations: number;
  cancelledReservations: number;
  carsOut: number;
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

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    activeReservations: 0,
    availableCars: 0,
    totalCars: 0,
    totalRevenue: 0,
    upcomingReturns: 0,
    totalCustomers: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    carsOut: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStats();
    fetchReservations();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      const today = getAngolaDate();

      const [reservationsRes, carsRes, customersRes, checkoutsRes] = await Promise.all([
        supabase
          .from("reservations")
          .select("total_amount, status, end_date"),
        supabase
          .from("cars")
          .select("id, is_available"),
        supabase
          .from("customers")
          .select("id, is_active"),
        supabase
          .from("checkouts")
          .select("id, reservation_id"),
      ]);

      console.log("Dashboard: Data fetched:", {
        reservations: reservationsRes.data?.length || 0,
        cars: carsRes.data?.length || 0,
        customers: customersRes.data?.length || 0,
        checkouts: checkoutsRes.data?.length || 0,
        reservationsError: reservationsRes.error,
        carsError: carsRes.error,
        customersError: customersRes.error,
        checkoutsError: checkoutsRes.error
      });

      if (reservationsRes.error) {
        console.error("Dashboard: Error fetching reservations:", reservationsRes.error);
      }
      if (carsRes.error) {
        console.error("Dashboard: Error fetching cars:", carsRes.error);
      }
      if (customersRes.error) {
        console.error("Dashboard: Error fetching customers:", customersRes.error);
      }
      if (checkoutsRes.error) {
        console.error("Dashboard: Error fetching checkouts:", checkoutsRes.error);
      }

      const allReservations = reservationsRes.data || [];
      const activeReservations = allReservations.filter(r => 
        ["confirmed", "active"].includes(r.status)
      ).length;
      
      const completedReservations = allReservations.filter(r => 
        r.status === "completed"
      ).length;
      
      const cancelledReservations = allReservations.filter(r => 
        r.status === "cancelled"
      ).length;

      const totalCars = carsRes.data?.length || 0;
      const availableCars = carsRes.data?.filter(car => car.is_available).length || 0;
      
      const totalRevenue = allReservations.reduce(
        (sum, r) => sum + parseFloat(String(r.total_amount || 0)), 
        0
      ) || 0;

      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const upcomingReturns = allReservations.filter(r => {
        const endDate = parseAngolaDate(r.end_date);
        return endDate >= today && endDate <= nextWeek && r.status === "active";
      }).length || 0;

      const totalCustomers = customersRes.data?.filter(c => c.is_active).length || 0;

      // Carros fora (checkouts sem checkin) - filtrar apenas checkouts da empresa
      const checkouts = checkoutsRes.data || [];
      let carsOut = 0;

      if (checkouts.length > 0) {
        const reservationIds = Array.from(
          new Set(checkouts.map((c: any) => c.reservation_id).filter(Boolean))
        );

        const { data: checkinsForCheckouts } = await supabase
          .from("checkins")
          .select("reservation_id")
          .in("reservation_id", reservationIds);

        const reservationsWithCheckin = new Set(
          (checkinsForCheckouts || []).map((c: any) => c.reservation_id)
        );

        carsOut = checkouts.filter(
          (checkout: any) => !reservationsWithCheckin.has(checkout.reservation_id)
        ).length;
      }

      const statsData = {
        activeReservations,
        availableCars,
        totalCars,
        totalRevenue,
        upcomingReturns,
        totalCustomers,
        completedReservations,
        cancelledReservations,
        carsOut,
      };
      
      console.log("Dashboard: Stats calculated:", statsData);
      setStats(statsData);
    } catch (error) {
      console.error("Dashboard: Error fetching stats:", error);
      console.error("Dashboard: Error details:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
      console.log("Dashboard: fetchStats completed");
    }
  };

  const fetchReservations = async () => {
    setReservationsLoading(true);

    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate),
          customers (name, phone)
        `)
        .order("start_date", { ascending: false });

      console.log("Dashboard: Reservations fetched:", {
        count: data?.length || 0,
        error: error ? { message: error.message, code: error.code, details: error.details } : null
      });

      if (error) {
        console.error("Dashboard: Error fetching reservations:", error);
        throw error;
      }
      
      // Filtrar reservas que já têm checkin (não devem aparecer no calendário)
      const reservationsData = (data as Reservation[]) || [];

      if (reservationsData.length === 0) {
        setReservations([]);
        return;
      }

      const reservationIds = reservationsData.map((r) => r.id);

      const { data: checkinsForReservations } = await supabase
        .from("checkins")
        .select("reservation_id")
        .in("reservation_id", reservationIds);

      const reservationsWithCheckin = new Set(
        (checkinsForReservations || []).map((c: any) => c.reservation_id)
      );

      // Remover reservas com checkin da lista
      const filteredReservations = reservationsData.filter(
        (r) => !reservationsWithCheckin.has(r.id)
      );

      setReservations(filteredReservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setReservationsLoading(false);
    }
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

  // Obter reservas próximas (começam 3 dias antes até 3 dias depois)
  const upcomingReservations = useMemo(() => {
    const today = getAngolaDate();
    const threeDaysBefore = new Date(today);
    threeDaysBefore.setDate(today.getDate() - 3);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    return reservations.filter(reservation => {
      if (reservation.status === "cancelled" || reservation.status === "completed") return false;
      
      const startDate = parseAngolaDate(reservation.start_date);
      const endDate = parseAngolaDate(reservation.end_date);
      
      // Reservas que começam entre 3 dias antes e 3 dias depois
      return (startDate >= threeDaysBefore && startDate <= threeDaysLater) || 
             (endDate >= threeDaysBefore && endDate <= threeDaysLater);
    }).sort((a, b) => {
      const dateA = parseAngolaDate(a.start_date);
      const dateB = parseAngolaDate(b.start_date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [reservations]);

  // Obter carros prestes a retornar (têm checkout mas não checkin, e data de retorno está próxima)
  const [upcomingReturns, setUpcomingReturns] = useState<Array<{
    reservation: Reservation;
    endDate: Date;
    daysUntil: number;
  }>>([]);

  useEffect(() => {
    const fetchUpcomingReturns = async () => {
      try {
        const today = getAngolaDate();
        const threeDaysBefore = new Date(today);
        threeDaysBefore.setDate(today.getDate() - 3);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);

        // Buscar checkouts sem checkin
        const { data: checkouts, error } = await supabase
          .from("checkouts")
          .select(`
            *,
            reservations!inner (
              id,
              car_id,
              customer_id,
              start_date,
              end_date,
              status,
              cars (brand, model, license_plate),
              customers (name, phone)
            )
          `);

        if (error) throw error;

        const returnsData: Array<{
          reservation: Reservation;
          endDate: Date;
          daysUntil: number;
        }> = [];

        const checkoutsData = (checkouts || []) as Array<any>;

        if (checkoutsData.length > 0) {
          const reservationIds = Array.from(
            new Set(
              checkoutsData
                .map((c) => (c.reservations as Reservation)?.id)
                .filter(Boolean)
            )
          );

          const { data: checkinsForReturns } = await supabase
            .from("checkins")
            .select("reservation_id")
            .in("reservation_id", reservationIds);

          const reservationsWithCheckin = new Set(
            (checkinsForReturns || []).map((c: any) => c.reservation_id)
          );

          for (const checkout of checkoutsData) {
            const reservation = checkout.reservations as Reservation;
            if (!reservation || reservationsWithCheckin.has(reservation.id)) continue;

            const endDate = parseAngolaDate(reservation.end_date);
            const daysUntil = differenceInDays(endDate, today);

            // Se a data de retorno está entre 3 dias antes e 3 dias depois
            if (endDate >= threeDaysBefore && endDate <= threeDaysLater) {
              returnsData.push({
                reservation,
                endDate,
                daysUntil,
              });
            }
          }
        }

        setUpcomingReturns(returnsData.sort((a, b) => a.daysUntil - b.daysUntil));
      } catch (error) {
        console.error("Error fetching upcoming returns:", error);
      }
    };

    fetchUpcomingReturns();
  }, []);

  // Notificações push
  useEffect(() => {
    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Verificar reservas próximas e enviar notificações
    if (upcomingReservations.length > 0 && Notification.permission === "granted") {
      upcomingReservations.forEach(reservation => {
        const startDate = parseAngolaDate(reservation.start_date);
        const today = getAngolaDate();
        const daysUntil = differenceInDays(startDate, today);
        
        // Notificar apenas se for hoje ou amanhã
        if (daysUntil <= 1) {
          const carName = reservation.cars 
            ? `${reservation.cars.brand} ${reservation.cars.model}` 
            : "Carro";
          const customerName = reservation.customers?.name || "Cliente";
          
          new Notification("Reserva Próxima", {
            body: `${carName} - ${customerName} - ${formatAngolaDate(reservation.start_date)}`,
            icon: "/favicon.ico",
            tag: reservation.id, // Evita notificações duplicadas
          });
        }
      });
    }
  }, [upcomingReservations]);

  const statCards = [
    {
      title: "Reservas Ativas",
      value: stats.activeReservations,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Carros Disponíveis",
      value: `${stats.availableCars}/${stats.totalCars}`,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      subtitle: `${stats.carsOut} fora`,
    },
    {
      title: "Clientes Ativos",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Receita Total",
      value: `${stats.totalRevenue.toLocaleString("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Reservas Concluídas",
      value: stats.completedReservations,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      title: "Reservas Canceladas",
      value: stats.cancelledReservations,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ];

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visão geral do sistema de reservas</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted" />
                <CardContent className="h-16 bg-muted mt-4" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {statCards.map((stat) => (
              <Card key={stat.title} className={`${stat.bgColor} border-2`}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 p-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color} flex-shrink-0`} />
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  {stat.subtitle && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Alertas de Reservas Próximas e Retornos */}
        {(upcomingReservations.length > 0 || upcomingReturns.length > 0) && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <CardTitle>Alertas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Alertas de Reservas Próximas */}
                  {upcomingReservations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-xs text-muted-foreground">RESERVAS PRÓXIMAS</h3>
                      <div className="space-y-2">
                        {upcomingReservations.map((reservation) => {
                          const startDate = parseAngolaDate(reservation.start_date);
                          const endDate = parseAngolaDate(reservation.end_date);
                          const today = getAngolaDate();
                    const daysUntil = differenceInDays(startDate, today);
                    const isStartingToday = isSameAngolaDay(startDate, today);
                    const daysUntilEnd = differenceInDays(endDate, today);
                    const isEndingSoon = daysUntilEnd <= 1 && daysUntilEnd >= 0;
                    
                    const isExpanded = expandedAlerts.has(reservation.id);
                    
                    return (
                      <Collapsible key={reservation.id} open={isExpanded} onOpenChange={(open) => {
                        const newSet = new Set(expandedAlerts);
                        if (open) {
                          newSet.add(reservation.id);
                        } else {
                          newSet.delete(reservation.id);
                        }
                        setExpandedAlerts(newSet);
                      }}>
                        <Alert 
                          variant={isStartingToday ? "destructive" : "default"}
                          className="cursor-pointer"
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <AlertTitle className="text-sm truncate">
                                  {isStartingToday 
                                    ? "Reserva começa HOJE" 
                                    : isEndingSoon 
                                    ? "Reserva termina em breve"
                                    : `Reserva em ${daysUntil} ${daysUntil === 1 ? "dia" : "dias"}`}
                                </AlertTitle>
                                <span className="text-xs text-muted-foreground truncate ml-2">
                                  - {reservation.cars 
                                    ? `${reservation.cars.brand} ${reservation.cars.model}` 
                                    : "Carro N/A"}
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <AlertDescription className="mt-2 pt-2 border-t">
                              <div className="flex flex-col gap-1 text-sm">
                                <span className="font-medium">
                                  {reservation.cars 
                                    ? `${reservation.cars.brand} ${reservation.cars.model}` 
                                    : "Carro N/A"}
                                </span>
                                <span>
                                  Cliente: {reservation.customers?.name || "N/A"}
                                </span>
                                <span>
                                  Período: {formatAngolaDate(reservation.start_date)} - {formatAngolaDate(reservation.end_date)}
                                </span>
                                <span className="font-semibold">
                                  Total: {reservation.total_amount.toFixed(2)} AKZ
                                </span>
                              </div>
                            </AlertDescription>
                          </CollapsibleContent>
                        </Alert>
                      </Collapsible>
                    );
                  })}
                    </div>
                  </div>
                  )}

                  {/* Alertas de Carros Prestes a Retornar */}
                  {upcomingReturns.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-xs text-muted-foreground">CARROS PRESTES A RETORNAR</h3>
                      <div className="space-y-2">
                        {upcomingReturns.map(({ reservation, endDate, daysUntil }) => {
                          const isReturningToday = daysUntil === 0;
                          const isReturningTomorrow = daysUntil === 1;
                          
                          const isExpanded = expandedAlerts.has(`return-${reservation.id}`);
                          
                          return (
                            <Collapsible key={reservation.id} open={isExpanded} onOpenChange={(open) => {
                              const newSet = new Set(expandedAlerts);
                              if (open) {
                                newSet.add(`return-${reservation.id}`);
                              } else {
                                newSet.delete(`return-${reservation.id}`);
                              }
                              setExpandedAlerts(newSet);
                            }}>
                              <Alert 
                                variant={isReturningToday ? "destructive" : "default"}
                                className="cursor-pointer"
                              >
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                      <AlertTitle className="text-sm truncate">
                                        {isReturningToday 
                                          ? "Carro retorna HOJE" 
                                          : isReturningTomorrow
                                          ? "Carro retorna AMANHÃ"
                                          : `Carro retorna em ${daysUntil} ${daysUntil === 1 ? "dia" : "dias"}`}
                                      </AlertTitle>
                                      <span className="text-xs text-muted-foreground truncate ml-2">
                                        - {reservation.cars 
                                          ? `${reservation.cars.brand} ${reservation.cars.model}` 
                                          : "Carro N/A"}
                                      </span>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
                                    )}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <AlertDescription className="mt-2 pt-2 border-t">
                                    <div className="flex flex-col gap-1 text-sm">
                                      <span className="font-medium">
                                        {reservation.cars 
                                          ? `${reservation.cars.brand} ${reservation.cars.model}` 
                                          : "Carro N/A"}
                                      </span>
                                      <span>
                                        Cliente: {reservation.customers?.name || "N/A"}
                                      </span>
                                      <span>
                                        Data de retorno: {formatAngolaDate(reservation.end_date)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Carro está fora desde o checkout
                                      </span>
                                    </div>
                                  </AlertDescription>
                                </CollapsibleContent>
                              </Alert>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calendário de Reservas */}
        <div className="mt-8">
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
              {reservationsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando calendário...</div>
              ) : (
                <div className="space-y-6">
                  {/* Legenda */}
                  {carColorMap.size > 0 && (
                    <div className="border rounded-lg p-3">
                      <h3 className="font-semibold mb-2 text-sm">Legenda de Cores</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;