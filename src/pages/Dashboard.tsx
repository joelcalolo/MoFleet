import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, DollarSign, AlertCircle, ChevronLeft, ChevronRight, Bell, Users, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, startOfDay, isSameDay, differenceInDays, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Reservation } from "@/pages/Reservations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  useEffect(() => {
    fetchStats();
    fetchReservations();
  }, []);

  const fetchStats = async () => {
    try {
      const today = getAngolaDate();

      const [reservationsRes, carsRes, customersRes, checkoutsRes] = await Promise.all([
        supabase
          .from("reservations")
          .select("total_amount, status, end_date"),
        supabase.from("cars").select("id, is_available"),
        supabase.from("customers").select("id, is_active"),
        supabase.from("checkouts").select("id, reservation_id"),
      ]);

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

      // Carros fora (checkouts sem checkin)
      const checkouts = checkoutsRes.data || [];
      let carsOut = 0;
      for (const checkout of checkouts) {
        const { data: checkin } = await supabase
          .from("checkins")
          .select("id")
          .eq("reservation_id", checkout.reservation_id)
          .maybeSingle();
        if (!checkin) carsOut++;
      }

      setStats({
        activeReservations,
        availableCars,
        totalCars,
        totalRevenue,
        upcomingReturns,
        totalCustomers,
        completedReservations,
        cancelledReservations,
        carsOut,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate),
          customers (name, phone)
        `)
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

        for (const checkout of (checkouts || []) as Array<any>) {
          const reservation = checkout.reservations as Reservation;
          
          // Verificar se não tem checkin
          const { data: checkin } = await supabase
            .from("checkins")
            .select("id")
            .eq("reservation_id", reservation.id)
            .maybeSingle();

          if (!checkin) {
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
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de reservas</p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted" />
                <CardContent className="h-16 bg-muted mt-4" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <Card key={stat.title} className={`${stat.bgColor} border-2`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
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
                <div className="space-y-4">
                  {/* Alertas de Reservas Próximas */}
                  {upcomingReservations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground">RESERVAS PRÓXIMAS</h3>
                      <div className="space-y-3">
                        {upcomingReservations.map((reservation) => {
                          const startDate = parseAngolaDate(reservation.start_date);
                          const endDate = parseAngolaDate(reservation.end_date);
                          const today = getAngolaDate();
                    const daysUntil = differenceInDays(startDate, today);
                    const isStartingToday = isSameAngolaDay(startDate, today);
                    const daysUntilEnd = differenceInDays(endDate, today);
                    const isEndingSoon = daysUntilEnd <= 1 && daysUntilEnd >= 0;
                    
                    return (
                      <Alert 
                        key={reservation.id}
                        variant={isStartingToday ? "destructive" : "default"}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => window.location.href = "/reservations"}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>
                          {isStartingToday 
                            ? "Reserva começa HOJE" 
                            : isEndingSoon 
                            ? "Reserva termina em breve"
                            : `Reserva em ${daysUntil} ${daysUntil === 1 ? "dia" : "dias"}`}
                        </AlertTitle>
                        <AlertDescription>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {reservation.cars 
                                ? `${reservation.cars.brand} ${reservation.cars.model}` 
                                : "Carro N/A"}
                            </span>
                            <span className="text-sm">
                              Cliente: {reservation.customers?.name || "N/A"}
                            </span>
                            <span className="text-sm">
                              Período: {formatAngolaDate(reservation.start_date)} - {formatAngolaDate(reservation.end_date)}
                            </span>
                            <span className="text-sm font-semibold">
                              Total: {reservation.total_amount.toFixed(2)} AKZ
                            </span>
                          </div>
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                    </div>
                  </div>
                  )}

                  {/* Alertas de Carros Prestes a Retornar */}
                  {upcomingReturns.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-muted-foreground">CARROS PRESTES A RETORNAR</h3>
                      <div className="space-y-3">
                        {upcomingReturns.map(({ reservation, endDate, daysUntil }) => {
                          const isReturningToday = daysUntil === 0;
                          const isReturningTomorrow = daysUntil === 1;
                          
                          return (
                            <Alert 
                              key={reservation.id}
                              variant={isReturningToday ? "destructive" : "default"}
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => window.location.href = "/fleet"}
                            >
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>
                                {isReturningToday 
                                  ? "Carro retorna HOJE" 
                                  : isReturningTomorrow
                                  ? "Carro retorna AMANHÃ"
                                  : `Carro retorna em ${daysUntil} ${daysUntil === 1 ? "dia" : "dias"}`}
                              </AlertTitle>
                              <AlertDescription>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {reservation.cars 
                                      ? `${reservation.cars.brand} ${reservation.cars.model}` 
                                      : "Carro N/A"}
                                  </span>
                                  <span className="text-sm">
                                    Cliente: {reservation.customers?.name || "N/A"}
                                  </span>
                                  <span className="text-sm">
                                    Data de retorno: {formatAngolaDate(reservation.end_date)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Carro está fora desde o checkout
                                  </span>
                                </div>
                              </AlertDescription>
                            </Alert>
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
              <div className="flex justify-between items-center">
                <CardTitle>Calendário de Reservas</CardTitle>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setCurrentDate(addMonths(currentDate, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold min-w-[200px] text-center">
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
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Legenda de Cores</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Cabeçalho dos dias da semana */}
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                          <div key={day} className="text-center text-sm font-semibold py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Grid do calendário */}
                      <div className="grid grid-cols-7 gap-2">
                        {days.map((day, dayIndex) => {
                          // Se for uma célula vazia (antes do primeiro dia do mês)
                          if (day === null) {
                            return (
                              <div
                                key={`empty-${dayIndex}`}
                                className="min-h-[120px] border rounded p-1 bg-muted/30"
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
                              className={`min-h-[120px] border rounded p-1 ${
                                isToday ? "bg-accent/50" : "bg-card"
                              }`}
                            >
                              <div className="text-xs font-medium mb-1">
                                {format(day, "d")}
                              </div>
                              <div className="space-y-1">
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
                                          className={`text-xs p-1 cursor-pointer hover:opacity-80 border ${
                                            carColor.light
                                          } ${carColor.border} ${
                                            isStart ? "rounded-l-md" : ""
                                          } ${isEnd ? "rounded-r-md" : ""} ${
                                            isMiddle ? "rounded-none" : ""
                                          }`}
                                          style={{
                                            borderLeftWidth: isStart || isFirstDay ? "2px" : "0",
                                            borderRightWidth: isEnd || isLastDay ? "2px" : "0",
                                            borderTopWidth: "2px",
                                            borderBottomWidth: "2px",
                                          }}
                                        >
                                          <div className="font-medium truncate">
                                            {reservation.cars
                                              ? `${reservation.cars.brand} ${reservation.cars.model}`
                                              : "N/A"}
                                          </div>
                                          <div className="text-[10px] text-muted-foreground truncate">
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