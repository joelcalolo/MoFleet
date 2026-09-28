import { useState, useMemo, useRef } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  active: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const CAR_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-600", text: "text-blue-700", light: "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200" },
  { bg: "bg-emerald-500", border: "border-emerald-600", text: "text-emerald-700", light: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200" },
  { bg: "bg-rose-500", border: "border-rose-600", text: "text-rose-700", light: "bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200" },
  { bg: "bg-amber-500", border: "border-amber-600", text: "text-amber-700", light: "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200" },
  { bg: "bg-purple-500", border: "border-purple-600", text: "text-purple-700", light: "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200" },
  { bg: "bg-pink-500", border: "border-pink-600", text: "text-pink-700", light: "bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-200" },
  { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-indigo-700", light: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200" },
  { bg: "bg-teal-500", border: "border-teal-600", text: "text-teal-700", light: "bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200" },
  { bg: "bg-cyan-500", border: "border-cyan-600", text: "text-cyan-700", light: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-200" },
  { bg: "bg-orange-500", border: "border-orange-600", text: "text-orange-700", light: "bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200" },
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = getAngolaDate();

  // Calendar states
  const [calendarDate, setCalendarDate] = useState<Date>(() => getAngolaDate());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => getAngolaDate());
  const [showLegend, setShowLegend] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

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

  // Color mapping per car
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

  const statCards = [
    {
      label: "Reservas Ativas",
      value: stats.activeReservations,
      icon: Calendar,
      from: "from-blue-500",
      to: "to-blue-600",
      shadow: "shadow-blue-500/25",
    },
    {
      label: "Carros Disponíveis",
      value: `${stats.availableCars}/${stats.totalCars}`,
      icon: Car,
      from: "from-emerald-500",
      to: "to-emerald-600",
      shadow: "shadow-emerald-500/25",
      sub: `${stats.carsOut} fora`,
    },
    {
      label: "Clientes",
      value: stats.totalCustomers,
      icon: Users,
      from: "from-violet-500",
      to: "to-violet-600",
      shadow: "shadow-violet-500/25",
    },
    {
      label: "Receita Total",
      value: stats.totalRevenue.toLocaleString("pt-AO", {
        style: "currency",
        currency: "AOA",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      icon: DollarSign,
      from: "from-amber-500",
      to: "to-amber-600",
      shadow: "shadow-amber-500/25",
      isWide: true,
    },
    {
      label: "Concluídas",
      value: stats.completedReservations,
      icon: CheckCircle,
      from: "from-teal-500",
      to: "to-teal-600",
      shadow: "shadow-teal-500/25",
    },
    {
      label: "Canceladas",
      value: stats.cancelledReservations,
      icon: XCircle,
      from: "from-rose-500",
      to: "to-rose-600",
      shadow: "shadow-rose-500/25",
    },
  ];

  const alertCount = upcomingReservations.length + upcomingReturns.length;

  return (
    <div className="px-4 pb-4 space-y-5">
      {/* ── Greeting Header ── */}
      <div className="pt-2 pb-1">
        <p className="text-muted-foreground text-sm font-medium">{greeting} 👋</p>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* ── Rate Limit Banner ── */}
      {isRateLimited && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">
            Sincronização em curso. Dados serão atualizados em breve.
          </p>
          <Button variant="ghost" size="sm" className="text-amber-700 h-7 px-2 text-xs" onClick={onRefetch}>
            Recarregar
          </Button>
        </div>
      )}

      {/* ── Stat Cards — horizontal scrollable ── */}
      <div>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="shrink-0 w-36 h-28 rounded-2xl bg-muted animate-pulse snap-start"
                />
              ))
            : statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={cn(
                      "shrink-0 snap-start rounded-2xl p-4 flex flex-col justify-between shadow-lg",
                      `bg-gradient-to-br ${card.from} ${card.to}`,
                      card.shadow,
                      card.isWide ? "w-44" : "w-36",
                      "min-h-[112px]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-xl bg-white/20">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {card.sub && (
                        <span className="text-[10px] text-white/80 bg-white/15 px-1.5 py-0.5 rounded-full font-medium">
                          {card.sub}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white/75 text-[11px] font-medium leading-tight mb-0.5">
                        {card.label}
                      </p>
                      <p className="text-white font-bold text-xl leading-tight tracking-tight">
                        {card.value}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* ── Alertas ── */}
      {alertCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-sm">
              Alertas
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                {alertCount}
              </span>
            </h2>
          </div>

          <div className="space-y-2">
            {/* Reservas próximas */}
            {upcomingReservations.map((reservation) => {
              const startDate = parseAngolaDate(reservation.start_date);
              const endDate = parseAngolaDate(reservation.end_date);
              const daysUntil = differenceInDays(startDate, today);
              const isStartingToday = daysUntil === 0;
              const daysUntilEnd = differenceInDays(endDate, today);
              const isEndingSoon = daysUntilEnd <= 1 && daysUntilEnd >= 0;
              const isExpanded = expandedAlerts.has(reservation.id);

              const alertTitle = isStartingToday
                ? "Começa HOJE"
                : isEndingSoon
                ? "Termina em breve"
                : `Em ${daysUntil} ${daysUntil === 1 ? "dia" : "dias"}`;

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
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3 transition-colors",
                      isStartingToday
                        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                        : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
                    )}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <AlertCircle
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isStartingToday ? "text-red-500" : "text-orange-500"
                            )}
                          />
                          <div className="text-left min-w-0">
                            <p className={cn("text-xs font-bold", isStartingToday ? "text-red-700 dark:text-red-400" : "text-orange-700 dark:text-orange-400")}>
                              {alertTitle}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {reservation.cars
                                ? `${reservation.cars.brand} ${reservation.cars.model}`
                                : "Carro N/A"}{" "}
                              · {reservation.customers?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t border-current/10 space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Período: </span>
                          {formatAngolaDate(reservation.start_date)} → {formatAngolaDate(reservation.end_date)}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Total: </span>
                          {reservation.total_amount.toFixed(2)} AKZ
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full h-8 text-xs rounded-xl"
                          onClick={() => navigate(`/reservation/${reservation.id}`)}
                        >
                          Ver Detalhes
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}

            {/* Retornos próximos */}
            {upcomingReturns.map(({ reservation, daysUntil }) => {
              const isReturningToday = daysUntil === 0;
              const isReturningTomorrow = daysUntil === 1;
              const isExpanded = expandedAlerts.has(`return-${reservation.id}`);

              const alertTitle = isReturningToday
                ? "Retorna HOJE"
                : isReturningTomorrow
                ? "Retorna AMANHÃ"
                : `Retorna em ${daysUntil} dias`;

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
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3 transition-colors",
                      isReturningToday
                        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                    )}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Truck
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isReturningToday ? "text-red-500" : "text-blue-500"
                            )}
                          />
                          <div className="text-left min-w-0">
                            <p className={cn("text-xs font-bold", isReturningToday ? "text-red-700 dark:text-red-400" : "text-blue-700 dark:text-blue-400")}>
                              {alertTitle}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {reservation.cars
                                ? `${reservation.cars.brand} ${reservation.cars.model}`
                                : "Carro N/A"}{" "}
                              · {reservation.customers?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t border-current/10 space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Retorno: </span>
                          {formatAngolaDate(reservation.end_date)}
                        </p>
                        <p className="text-muted-foreground/70 text-[11px]">Carro está fora desde o checkout</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full h-8 text-xs rounded-xl"
                          onClick={() => navigate(`/reservation/${reservation.id}`)}
                        >
                          Ver Detalhes
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Calendário de Reservas (Mobile) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Calendário de Reservas</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs h-7 px-2 rounded-lg"
            onClick={() => navigate("/schedule")}
          >
            Agenda completa
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm space-y-3">
          {/* Controls: Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl shrink-0"
              onClick={() => setCalendarDate((d) => addMonths(d, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center min-w-0 flex-1 px-2">
              <span className="font-bold text-sm capitalize truncate block">
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
                  Voltar para Hoje
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl shrink-0"
              onClick={() => setCalendarDate((d) => addMonths(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Color Legend (Collapsible) */}
          {carColorMap.size > 0 && (
            <Collapsible open={showLegend} onOpenChange={setShowLegend}>
              <div className="bg-muted/40 rounded-xl p-2.5 text-xs">
                <CollapsibleTrigger className="flex items-center justify-between w-full text-muted-foreground font-medium text-[11px]">
                  <span>Legenda de Veículos ({carColorMap.size})</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-primary font-normal">{showLegend ? "Ocultar" : "Mostrar"}</span>
                    {showLegend ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 pt-2 border-t border-border/40">
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {Array.from(carColorMap.values()).map((carColor) => (
                      <div key={carColor.carId} className="flex items-center gap-1.5 min-w-0">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", carColor.bg)} />
                        <span className="truncate text-foreground font-medium">{carColor.carName}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, idx) => (
              <div key={idx} className="text-[11px] font-bold text-muted-foreground py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {reservationsLoading ? (
            <div className="h-48 rounded-xl bg-muted animate-pulse flex items-center justify-center text-xs text-muted-foreground">
              Carregando calendário...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, dayIndex) => {
                if (day === null) {
                  return <div key={`empty-${dayIndex}`} className="h-14 rounded-xl bg-muted/15" />;
                }

                const dayReservations = getReservationsForDay(day);
                const isToday = isSameAngolaDay(day, today);
                const isSelected = selectedDay && isSameAngolaDay(day, selectedDay);
                const hasReservations = dayReservations.length > 0;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "h-14 rounded-xl p-1 flex flex-col justify-between items-center transition-all text-left relative overflow-hidden border",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : isToday
                        ? "border-primary/50 bg-accent/40"
                        : hasReservations
                        ? "border-border/80 bg-card hover:bg-muted/30"
                        : "border-transparent bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    {/* Day Number */}
                    <span
                      className={cn(
                        "text-[11px] font-semibold flex items-center justify-center w-5 h-5 rounded-full",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : isSelected
                          ? "text-primary font-bold"
                          : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Reservation Badges */}
                    <div className="w-full space-y-0.5 mt-0.5 min-h-[16px] flex flex-col justify-end">
                      {dayReservations.slice(0, 2).map((reservation) => {
                        const carColor = carColorMap.get(reservation.car_id);
                        const carName = reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "Veículo";
                        return (
                          <div
                            key={reservation.id}
                            className={cn(
                              "text-[8px] leading-tight px-1 py-0.5 rounded truncate font-medium flex items-center gap-1",
                              carColor ? carColor.light : "bg-muted text-muted-foreground"
                            )}
                            title={`${carName} - ${reservation.customers?.name || "Cliente"}`}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", carColor?.bg || "bg-primary")} />
                            <span className="truncate">{carName}</span>
                          </div>
                        );
                      })}

                      {dayReservations.length > 2 && (
                        <div className="text-[7px] font-bold text-center text-muted-foreground leading-none">
                          +{dayReservations.length - 2} mais
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
                <p className="text-xs font-semibold text-foreground capitalize">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <Badge variant="outline" className="text-[10px] rounded-full font-medium">
                  {selectedDayReservations.length} {selectedDayReservations.length === 1 ? "reserva" : "reservas"}
                </Badge>
              </div>

              {selectedDayReservations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded-xl">
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
                        className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={cn("w-2 h-10 rounded-full shrink-0", carColor?.bg || "bg-primary")} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-foreground truncate">
                                {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "Veículo N/A"}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] px-1.5 py-0 border rounded-full font-medium shrink-0", statusColors[reservation.status])}
                              >
                                {statusLabels[reservation.status]}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {reservation.customers?.name || "Cliente N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatAngolaDate(reservation.start_date)} → {formatAngolaDate(reservation.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-foreground">
                            {reservation.total_amount.toLocaleString("pt-AO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} AKZ
                          </p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Reservas Recentes — Timeline Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Reservas Recentes</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs h-7 px-2 rounded-lg"
            onClick={() => navigate("/reservations")}
          >
            Ver todas
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {reservationsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : recentReservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 py-10 flex flex-col items-center gap-2 text-muted-foreground">
            <Calendar className="h-8 w-8 opacity-30" />
            <p className="text-sm">Sem reservas activas</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1 rounded-xl text-xs"
              onClick={() => navigate("/reservations?new=true")}
            >
              Criar primeira reserva
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReservations.map((reservation) => {
              const endDate = parseAngolaDate(reservation.end_date);
              const daysLeft = differenceInDays(endDate, today);
              const isActive = reservation.status === "active";
              const isPending = reservation.status === "pending";

              return (
                <button
                  key={reservation.id}
                  onClick={() => navigate(`/reservation/${reservation.id}`)}
                  className="w-full text-left rounded-2xl border border-border/60 bg-card hover:bg-muted/40 active:scale-[0.99] transition-all p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: car icon background */}
                    <div className={cn(
                      "p-2.5 rounded-xl shrink-0",
                      isActive ? "bg-emerald-100 dark:bg-emerald-900/30" : isPending ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                    )}>
                      <Car className={cn(
                        "h-5 w-5",
                        isActive ? "text-emerald-600" : isPending ? "text-amber-600" : "text-muted-foreground"
                      )} />
                    </div>

                    {/* Middle: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {reservation.cars
                            ? `${reservation.cars.brand} ${reservation.cars.model}`
                            : "Veículo N/A"}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 border rounded-full font-medium shrink-0", statusColors[reservation.status])}
                        >
                          {statusLabels[reservation.status]}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {reservation.customers?.name || "Cliente N/A"}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-muted-foreground">
                          {formatAngolaDate(reservation.start_date)} → {formatAngolaDate(reservation.end_date)}
                        </span>
                      </div>
                    </div>

                    {/* Right: amount + days */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        {reservation.total_amount.toLocaleString("pt-AO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">AKZ</p>
                      {isActive && daysLeft >= 0 && (
                        <p className="text-[10px] text-emerald-600 font-medium mt-1">
                          {daysLeft === 0 ? "Termina hoje" : `${daysLeft}d restantes`}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Links ── */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Agenda", icon: Calendar, path: "/schedule", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Frota", icon: Truck, path: "/fleet", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            { label: "Clientes", icon: Users, path: "/customers", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
            { label: "Resumo", icon: TrendingUp, path: "/rentals-summary", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 active:scale-[0.98] transition-all text-left"
              >
                <div className={cn("p-2 rounded-xl", item.bg)}>
                  <Icon className={cn("h-4 w-4", item.color)} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
