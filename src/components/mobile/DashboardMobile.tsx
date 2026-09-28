import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Calendar,
  DollarSign,
  AlertCircle,
  Bell,
  Users,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Truck,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Reservation } from "@/pages/Reservations";
import { formatAngolaDate, parseAngolaDate, getAngolaDate, isSameAngolaDay } from "@/lib/dateUtils";
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface DashboardMobileProps {
  stats: Stats;
  loading: boolean;
  reservations: Reservation[];
  reservationsLoading: boolean;
  upcomingReturns: Array<{ reservation: Reservation; endDate: Date; daysUntil: number }>;
  upcomingReservations: Reservation[];
  isRateLimited: boolean;
  expandedAlerts: Set<string>;
  setExpandedAlerts: (s: Set<string>) => void;
  onRefetch: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400",
  cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  active: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const CAR_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-600", text: "text-blue-700", light: "bg-blue-100 dark:bg-blue-950/40" },
  { bg: "bg-green-500", border: "border-green-600", text: "text-green-700", light: "bg-green-100 dark:bg-green-950/40" },
  { bg: "bg-red-500", border: "border-red-600", text: "text-red-700", light: "bg-red-100 dark:bg-red-950/40" },
  { bg: "bg-yellow-500", border: "border-yellow-600", text: "text-yellow-700", light: "bg-yellow-100 dark:bg-yellow-950/40" },
  { bg: "bg-purple-500", border: "border-purple-600", text: "text-purple-700", light: "bg-purple-100 dark:bg-purple-950/40" },
  { bg: "bg-pink-500", border: "border-pink-600", text: "text-pink-700", light: "bg-pink-100 dark:bg-pink-950/40" },
  { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-indigo-700", light: "bg-indigo-100 dark:bg-indigo-950/40" },
  { bg: "bg-orange-500", border: "border-orange-600", text: "text-orange-700", light: "bg-orange-100 dark:bg-orange-950/40" },
  { bg: "bg-teal-500", border: "border-teal-600", text: "text-teal-700", light: "bg-teal-100 dark:bg-teal-950/40" },
  { bg: "bg-cyan-500", border: "border-cyan-600", text: "text-cyan-700", light: "bg-cyan-100 dark:bg-cyan-950/40" },
];

export const DashboardMobile = ({
  stats,
  loading,
  reservations,
  reservationsLoading,
  upcomingReturns,
  upcomingReservations,
  isRateLimited,
  expandedAlerts,
  setExpandedAlerts,
  onRefetch,
}: DashboardMobileProps) => {
  const navigate = useNavigate();
  const today = getAngolaDate();

  // Calendar states
  const [calendarDate, setCalendarDate] = useState<Date>(() => getAngolaDate());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => getAngolaDate());

  // Filter reservations for current calendar month
  const monthReservations = useMemo(() => {
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);
    return reservations.filter((reservation) => {
      if (reservation.status === "cancelled") return false;
      const resStart = parseAngolaDate(reservation.start_date);
      const resEnd = parseAngolaDate(reservation.end_date);
      return resEnd >= start && resStart <= end;
    });
  }, [reservations, calendarDate]);

  // Color mapping per car (identical to desktop Dashboard.tsx)
  const carColorMap = useMemo(() => {
    const map = new Map<string, (typeof CAR_COLORS)[0] & { carId: string; carName: string }>();
    const activeReservations = reservations.filter((r) => r.status !== "cancelled");
    const uniqueCars = new Map<string, { brand: string; model: string; license_plate: string }>();
    activeReservations.forEach((reservation) => {
      if (reservation.cars && !uniqueCars.has(reservation.car_id)) {
        uniqueCars.set(reservation.car_id, reservation.cars);
      }
    });
    let colorIndex = 0;
    uniqueCars.forEach((car, carId) => {
      const color = CAR_COLORS[colorIndex % CAR_COLORS.length];
      map.set(carId, { ...color, carId, carName: `${car.brand} ${car.model}` });
      colorIndex++;
    });
    return map;
  }, [reservations]);

  const getReservationsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    return monthReservations.filter((reservation) => {
      const start = parseAngolaDate(reservation.start_date);
      const end = parseAngolaDate(reservation.end_date);
      return dayStart >= start && dayStart <= end;
    });
  };

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(calendarDate),
      end: endOfMonth(calendarDate),
    });
  }, [calendarDate]);

  const firstDayOfWeek = getDay(startOfMonth(calendarDate));
  const emptyCells = Array(firstDayOfWeek).fill(null);
  const days = [...emptyCells, ...monthDays];

  const selectedDayReservations = useMemo(() => {
    if (!selectedDay) return [];
    return getReservationsForDay(selectedDay);
  }, [selectedDay, monthReservations]);

  // Recent reservations (last 10, not cancelled)
  const recentReservations = useMemo(() => {
    return reservations
      .filter((r) => r.status !== "cancelled")
      .slice(0, 10);
  }, [reservations]);

  // Stat cards matching desktop Dashboard.tsx
  const statCards = [
    { title: "Reservas Ativas", value: stats.activeReservations, icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/40" },
    { title: "Carros Disponíveis", value: `${stats.availableCars}/${stats.totalCars}`, icon: Car, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/40", subtitle: `${stats.carsOut} fora` },
    { title: "Clientes Ativos", value: stats.totalCustomers, icon: Users, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/40" },
    { title: "Receita Total", value: `${stats.totalRevenue.toLocaleString("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 })}`, icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/40" },
    { title: "Concluídas", value: stats.completedReservations, icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/40" },
    { title: "Canceladas", value: stats.cancelledReservations, icon: XCircle, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/40" },
  ];

  const alertCount = upcomingReservations.length + upcomingReturns.length;

  return (
    <div className="px-4 py-4 space-y-6">
      {/* ── Page Header — clean desktop style without emojis ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Visão geral do sistema de reservas
        </p>
      </div>

      {/* ── Rate Limit Alert ── */}
      {isRateLimited && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-xs font-semibold">Sincronização em curso</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between gap-2 mt-1">
            <span>Dados em atualização...</span>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={onRefetch}>
              Recarregar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Stat Cards Grid (Desktop card style) ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse h-20 bg-muted/50 border-0" />
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className={cn("border border-border/80 p-3 shadow-none", stat.bgColor)}>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-medium text-muted-foreground truncate">{stat.title}</span>
                    <Icon className={cn("h-4 w-4 shrink-0", stat.color)} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground tracking-tight">{stat.value}</div>
                    {stat.subtitle && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
                    )}
                  </div>
                </Card>
              );
            })}
      </div>

      {/* ── Alertas (Alert Cards matching desktop) ── */}
      {alertCount > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-base font-semibold">Alertas ({alertCount})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            {upcomingReservations.map((reservation) => {
              const startDate = parseAngolaDate(reservation.start_date);
              const endDate = parseAngolaDate(reservation.end_date);
              const daysUntil = differenceInDays(startDate, today);
              const isStartingToday = daysUntil === 0;
              const daysUntilEnd = differenceInDays(endDate, today);
              const isEndingSoon = daysUntilEnd <= 1 && daysUntilEnd >= 0;
              const isExpanded = expandedAlerts.has(reservation.id);

              const alertTitle = isStartingToday
                ? "Reserva começa HOJE"
                : isEndingSoon
                ? "Reserva termina em breve"
                : `Reserva em ${daysUntil} ${daysUntil === 1 ? "dia" : "dias"}`;

              return (
                <Collapsible
                  key={reservation.id}
                  open={isExpanded}
                  onOpenChange={(open) => {
                    const s = new Set(expandedAlerts);
                    open ? s.add(reservation.id) : s.delete(reservation.id);
                    setExpandedAlerts(s);
                  }}
                >
                  <Alert variant={isStartingToday ? "destructive" : "default"} className="p-3 cursor-pointer">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <div className="text-left min-w-0">
                            <AlertTitle className="text-xs font-semibold truncate">{alertTitle}</AlertTitle>
                            <AlertDescription className="text-[11px] text-muted-foreground truncate">
                              {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "Veículo N/A"} - {reservation.customers?.name || "Cliente N/A"}
                            </AlertDescription>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 ml-1" /> : <ChevronDown className="h-4 w-4 shrink-0 ml-1" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 pt-2 border-t border-border/60 text-xs space-y-1">
                        <p><span className="font-medium">Período:</span> {formatAngolaDate(reservation.start_date)} - {formatAngolaDate(reservation.end_date)}</p>
                        <p><span className="font-medium">Total:</span> {reservation.total_amount.toLocaleString("pt-AO")} AKZ</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full h-8 text-xs rounded-lg"
                          onClick={() => navigate(`/reservation/${reservation.id}`)}
                        >
                          Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Alert>
                </Collapsible>
              );
            })}

            {upcomingReturns.map(({ reservation, daysUntil }) => {
              const isReturningToday = daysUntil === 0;
              const isReturningTomorrow = daysUntil === 1;
              const isExpanded = expandedAlerts.has(`return-${reservation.id}`);

              const alertTitle = isReturningToday
                ? "Carro retorna HOJE"
                : isReturningTomorrow
                ? "Carro retorna AMANHÃ"
                : `Carro retorna em ${daysUntil} dias`;

              return (
                <Collapsible
                  key={`return-${reservation.id}`}
                  open={isExpanded}
                  onOpenChange={(open) => {
                    const s = new Set(expandedAlerts);
                    open ? s.add(`return-${reservation.id}`) : s.delete(`return-${reservation.id}`);
                    setExpandedAlerts(s);
                  }}
                >
                  <Alert variant={isReturningToday ? "destructive" : "default"} className="p-3 cursor-pointer">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Truck className="h-4 w-4 shrink-0" />
                          <div className="text-left min-w-0">
                            <AlertTitle className="text-xs font-semibold truncate">{alertTitle}</AlertTitle>
                            <AlertDescription className="text-[11px] text-muted-foreground truncate">
                              {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "Veículo N/A"} - {reservation.customers?.name || "Cliente N/A"}
                            </AlertDescription>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 ml-1" /> : <ChevronDown className="h-4 w-4 shrink-0 ml-1" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 pt-2 border-t border-border/60 text-xs space-y-1">
                        <p><span className="font-medium">Data de retorno:</span> {formatAngolaDate(reservation.end_date)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full h-8 text-xs rounded-lg"
                          onClick={() => navigate(`/reservation/${reservation.id}`)}
                        >
                          Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Alert>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Calendário de Reservas (Clean desktop style wrapped in Card) ── */}
      <Card>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Calendário de Reservas
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-primary hover:text-primary"
              onClick={() => navigate("/schedule")}
            >
              Agenda <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setCalendarDate((d) => addMonths(d, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center min-w-0 flex-1 px-2">
              <span className="font-semibold text-sm capitalize truncate block">
                {format(calendarDate, "MMMM yyyy", { locale: ptBR })}
              </span>
              {!isSameAngolaDay(calendarDate, today) && (
                <button
                  onClick={() => {
                    setCalendarDate(today);
                    setSelectedDay(today);
                  }}
                  className="text-[10px] text-primary hover:underline font-medium block mx-auto mt-0.5"
                >
                  Hoje
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setCalendarDate((d) => addMonths(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3">
          {/* Legenda de Cores (igual ao Desktop) */}
          {carColorMap.size > 0 && (
            <div className="border rounded-lg p-2.5 bg-muted/20 text-xs">
              <span className="font-semibold text-[11px] text-muted-foreground block mb-1.5">
                Legenda de Cores
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {Array.from(carColorMap.values()).map((carColor) => (
                  <div key={carColor.carId} className="flex items-center gap-1.5 min-w-0">
                    <div className={cn("w-3 h-3 rounded shrink-0 border", carColor.bg, carColor.border)} />
                    <span className="truncate text-foreground font-medium">{carColor.carName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center border-b pb-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, idx) => (
              <div key={idx} className="text-[10px] font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          {reservationsLoading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">Carregando calendário...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, dayIndex) => {
                if (day === null) {
                  return <div key={`empty-${dayIndex}`} className="min-h-[48px] border rounded p-0.5 bg-muted/20" />;
                }

                const dayReservations = getReservationsForDay(day);
                const isToday = isSameAngolaDay(day, today);
                const isSelected = selectedDay && isSameAngolaDay(day, selectedDay);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-[48px] border rounded p-1 flex flex-col justify-between text-left transition-colors relative",
                      isSelected
                        ? "border-primary ring-1 ring-primary bg-primary/5"
                        : isToday
                        ? "bg-accent/50 border-primary/40"
                        : "bg-card hover:bg-muted/30"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-semibold block leading-tight",
                        isToday ? "text-primary font-bold" : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="space-y-0.5 mt-1">
                      {dayReservations.slice(0, 2).map((reservation) => {
                        const carColor = carColorMap.get(reservation.car_id);
                        return (
                          <div
                            key={reservation.id}
                            className={cn(
                              "text-[8px] p-0.5 rounded border truncate font-medium leading-tight",
                              carColor ? `${carColor.light} ${carColor.border}` : "bg-muted border-border"
                            )}
                          >
                            {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "Veículo"}
                          </div>
                        );
                      })}
                      {dayReservations.length > 2 && (
                        <div className="text-[7px] text-muted-foreground font-semibold text-center leading-none">
                          +{dayReservations.length - 2}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Date Details Panel */}
          {selectedDay && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold capitalize text-foreground">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </span>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {selectedDayReservations.length} {selectedDayReservations.length === 1 ? "reserva" : "reservas"}
                </Badge>
              </div>

              {selectedDayReservations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded-lg">
                  Nenhuma reserva para este dia
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayReservations.map((reservation) => {
                    const carColor = carColorMap.get(reservation.car_id);
                    return (
                      <div
                        key={reservation.id}
                        onClick={() => navigate(`/reservation/${reservation.id}`)}
                        className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={cn("w-1.5 h-8 rounded-full shrink-0", carColor?.bg || "bg-primary")} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold truncate text-foreground">
                                {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "Veículo N/A"}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] px-1.5 py-0 rounded font-normal shrink-0", statusColors[reservation.status])}
                              >
                                {statusLabels[reservation.status]}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {reservation.customers?.name || "Cliente N/A"} · {formatAngolaDate(reservation.start_date)} - {formatAngolaDate(reservation.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-foreground">
                            {reservation.total_amount.toLocaleString("pt-AO")} AKZ
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Reservas Recentes (Standard Desktop Card Style) ── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Reservas Recentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-primary hover:text-primary"
              onClick={() => navigate("/reservations")}
            >
              Ver todas <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          {reservationsLoading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Carregando...</div>
          ) : recentReservations.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Sem reservas ativas
            </div>
          ) : (
            <div className="space-y-2">
              {recentReservations.map((reservation) => {
                const endDate = parseAngolaDate(reservation.end_date);
                const daysLeft = differenceInDays(endDate, today);
                const isActive = reservation.status === "active";

                return (
                  <div
                    key={reservation.id}
                    onClick={() => navigate(`/reservation/${reservation.id}`)}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground truncate">
                          {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "Veículo N/A"}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] px-1.5 py-0 rounded font-normal shrink-0", statusColors[reservation.status])}
                        >
                          {statusLabels[reservation.status]}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {reservation.customers?.name || "Cliente N/A"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatAngolaDate(reservation.start_date)} - {formatAngolaDate(reservation.end_date)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">
                        {reservation.total_amount.toLocaleString("pt-AO")} AKZ
                      </p>
                      {isActive && daysLeft >= 0 && (
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          {daysLeft === 0 ? "Termina hoje" : `${daysLeft}d restantes`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Acesso Rápido (Clean Card Style) ── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Agenda", icon: Calendar, path: "/schedule" },
              { label: "Frota de Veículos", icon: Truck, path: "/fleet" },
              { label: "Clientes", icon: Users, path: "/customers" },
              { label: "Resumo", icon: TrendingUp, path: "/rentals-summary" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant="outline"
                  className="h-11 justify-start gap-2.5 rounded-lg px-3 text-xs font-medium text-foreground hover:bg-muted"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
