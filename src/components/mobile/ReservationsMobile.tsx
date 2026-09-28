import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Car,
  Search,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  FileDown,
  Filter,
  SlidersHorizontal,
  ArrowRight,
  CarFront,
  CarTaxiFront,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Reservation } from "@/pages/Reservations";
import { formatAngolaDate, parseAngolaDate, getAngolaDate } from "@/lib/dateUtils";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface ReservationsMobileProps {
  reservations: Reservation[];
  loading: boolean;
  onEdit: (reservation: Reservation) => void;
  onRefresh: () => void;
  onNew: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  active: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const statusIconColors: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
  confirmed: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
  active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
  completed: "bg-gray-100 dark:bg-gray-800 text-gray-500",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-500",
};

const ALL_STATUSES = ["pending", "confirmed", "active", "completed", "cancelled"] as const;
type StatusType = typeof ALL_STATUSES[number];

export const ReservationsMobile = ({
  reservations,
  loading,
  onEdit,
  onRefresh,
  onNew,
}: ReservationsMobileProps) => {
  const navigate = useNavigate();
  const today = getAngolaDate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusType | "all">("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = reservations;
    if (filterStatus !== "all") {
      list = list.filter((r) => r.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const car = r.cars ? `${r.cars.brand} ${r.cars.model} ${r.cars.license_plate}`.toLowerCase() : "";
        const customer = r.customers?.name?.toLowerCase() || "";
        return car.includes(q) || customer.includes(q);
      });
    }
    return list;
  }, [reservations, filterStatus, searchQuery]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  // ── Status counts for filter pills ──
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: reservations.length };
    ALL_STATUSES.forEach((s) => {
      map[s] = reservations.filter((r) => r.status === s).length;
    });
    return map;
  }, [reservations]);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", cancelId);
      if (error) throw error;
      toast.success("Reserva cancelada com sucesso");
      onRefresh();
    } catch {
      toast.error("Erro ao cancelar reserva");
    } finally {
      setCancelId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("reservations").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Reserva removida com sucesso");
      onRefresh();
    } catch {
      toast.error("Erro ao remover reserva");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="pb-4">
      {/* ── Header ── */}
      <div className="px-4 pt-2 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Reservas</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {reservations.length} reserva{reservations.length !== 1 ? "s" : ""} no sistema
        </p>
      </div>

      {/* ── Search + Filter ── */}
      <div className="px-4 mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Carro, cliente..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl h-10 bg-muted/50 border-border/50 focus:bg-background"
          />
        </div>
        <Button
          variant={filterStatus !== "all" ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 rounded-xl shrink-0"
          onClick={() => setFilterSheetOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Status Filter Scrollable Pills ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 px-4 mb-3 snap-x scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {[
          { key: "all", label: "Todas" },
          { key: "active", label: "Em Andamento" },
          { key: "confirmed", label: "Confirmadas" },
          { key: "pending", label: "Pendentes" },
          { key: "completed", label: "Concluídas" },
          { key: "cancelled", label: "Canceladas" },
        ].map(({ key, label }) => {
          const active = filterStatus === key;
          const count = counts[key] ?? 0;
          return (
            <button
              key={key}
              onClick={() => { setFilterStatus(key as StatusType | "all"); setPage(1); }}
              className={cn(
                "shrink-0 snap-start flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all border",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
              )}
            >
              {label}
              <span className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1",
                active ? "bg-white/20 text-white" : "bg-border/40 text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Results info ── */}
      {(searchQuery || filterStatus !== "all") && (
        <div className="px-4 mb-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            {filterStatus !== "all" && ` · ${statusLabels[filterStatus]}`}
            {searchQuery && ` · "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[100px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-14 flex flex-col items-center gap-3 text-muted-foreground">
          <CalendarDays className="h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">Nenhuma reserva encontrada</p>
          {searchQuery || filterStatus !== "all" ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
            >
              Limpar filtros
            </Button>
          ) : (
            <Button size="sm" className="rounded-xl text-xs" onClick={onNew}>
              Criar primeira reserva
            </Button>
          )}
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {paginated.map((reservation) => {
            const endDate = parseAngolaDate(reservation.end_date);
            const startDate = parseAngolaDate(reservation.start_date);
            const daysLeft = differenceInDays(endDate, today);
            const isActive = reservation.status === "active";
            const isCancelled = reservation.status === "cancelled";
            const isCompleted = reservation.status === "completed";

            return (
              <div
                key={reservation.id}
                className={cn(
                  "rounded-2xl border bg-card shadow-sm overflow-hidden transition-all active:scale-[0.99]",
                  isCancelled ? "opacity-60 border-border/40" : "border-border/60"
                )}
              >
                {/* Card Top: tap to open details */}
                <button
                  className="w-full text-left px-4 pt-4 pb-3"
                  onClick={() => navigate(`/reservation/${reservation.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn("p-2.5 rounded-xl shrink-0", statusIconColors[reservation.status])}>
                      {reservation.with_driver ? (
                        <CarTaxiFront className="h-5 w-5" />
                      ) : (
                        <CarFront className="h-5 w-5" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {reservation.cars
                            ? `${reservation.cars.brand} ${reservation.cars.model}`
                            : "Veículo N/A"}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 h-5 border rounded-full font-semibold shrink-0", statusColors[reservation.status])}
                        >
                          {statusLabels[reservation.status]}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {reservation.customers?.name || "Cliente N/A"}
                        {reservation.cars?.license_plate && (
                          <span className="ml-1.5 text-muted-foreground/60">· {reservation.cars.license_plate}</span>
                        )}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatAngolaDate(reservation.start_date)} → {formatAngolaDate(reservation.end_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {reservation.location_type === "city" ? "Cidade" : "Fora da cidade"}
                          {reservation.with_driver && " · Com motorista"}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-base text-foreground leading-tight">
                        {reservation.total_amount.toLocaleString("pt-AO", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">AKZ</p>
                      {isActive && daysLeft >= 0 && (
                        <div className="flex items-center justify-end gap-0.5 mt-1">
                          <Clock className="h-2.5 w-2.5 text-emerald-500" />
                          <p className="text-[10px] text-emerald-600 font-semibold">
                            {daysLeft === 0 ? "Hoje" : `${daysLeft}d`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Card Bottom: actions row */}
                {!isCancelled && (
                  <div className="flex items-center gap-1 px-3 pb-3 pt-0 border-t border-border/30 mt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/reservation/${reservation.id}`)}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Detalhes
                    </Button>

                    {!isCompleted && !isCancelled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-xs rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(reservation)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        window.open(
                          `${window.location.origin}/reservation/${reservation.id}?openPdf=1`,
                          "_blank"
                        )
                      }
                      title="Download PDF"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </Button>

                    {!isCompleted && !isCancelled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setCancelId(reservation.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Load More ── */}
          {hasMore && (
            <Button
              variant="outline"
              className="w-full rounded-2xl h-11 text-sm font-medium border-dashed"
              onClick={() => setPage((p) => p + 1)}
            >
              Carregar mais ({filtered.length - paginated.length} restantes)
            </Button>
          )}
        </div>
      )}

      {/* ── Filter Sheet ── */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-6 max-h-[60vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-5" />
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrar Reservas
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {[
              { key: "all", label: "Todas as reservas" },
              { key: "active", label: "Em Andamento" },
              { key: "confirmed", label: "Confirmadas" },
              { key: "pending", label: "Pendentes" },
              { key: "completed", label: "Concluídas" },
              { key: "cancelled", label: "Canceladas" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilterStatus(key as StatusType | "all"); setFilterSheetOpen(false); setPage(1); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors border",
                  filterStatus === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border/40 text-foreground hover:bg-muted"
                )}
              >
                <span>{label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  filterStatus === key ? "bg-white/20" : "bg-border/40"
                )}>
                  {counts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Cancel Dialog ── */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent className="rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja cancelar esta reserva? O status será alterado para "Cancelada".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Não cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A reserva será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
