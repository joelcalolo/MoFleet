import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CarFront, CarTaxiFront, Search } from "lucide-react";
import { toast } from "sonner";
import { Reservation } from "@/pages/Reservations";
import { handleError, logError } from "@/lib/errorHandler";
import { Pagination } from "@/components/ui/pagination";
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
import { formatAngolaDate } from "@/lib/dateUtils";
import { getEmployeeNamesBatch } from "@/lib/userUtils";

interface ReservationListProps {
  reservations: Reservation[];
  loading: boolean;
  onEdit: (reservation: Reservation) => void;
  onRefresh: () => void;
}

const statusColors = {
  pending: "bg-status-pending text-status-pending",
  confirmed: "bg-status-confirmed text-status-confirmed",
  active: "bg-status-active text-status-active",
  completed: "bg-status-completed text-status-completed",
  cancelled: "bg-status-cancelled text-status-cancelled",
};

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmada",
  active: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const ReservationList = ({ reservations, loading, onEdit, onRefresh }: ReservationListProps) => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeNames, setEmployeeNames] = useState<Map<string, string>>(new Map());
  const itemsPerPage = 10;

  // Buscar nomes dos funcionários quando as reservas mudarem
  useEffect(() => {
    const fetchEmployeeNames = async () => {
      const userIds: string[] = [];
      const companyUserIds: string[] = [];

      reservations.forEach((r: any) => {
        if (r.created_by_user_id) userIds.push(r.created_by_user_id);
        if (r.created_by_company_user_id) companyUserIds.push(r.created_by_company_user_id);
      });

      if (userIds.length > 0 || companyUserIds.length > 0) {
        const names = await getEmployeeNamesBatch(userIds, companyUserIds);
        setEmployeeNames(names);
      }
    };

    if (reservations.length > 0) {
      fetchEmployeeNames();
    }
  }, [reservations]);

  // Filtrar reservas baseado na pesquisa
  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) return reservations;
    
    const query = searchQuery.toLowerCase();
    return reservations.filter(reservation => {
      const carName = reservation.cars 
        ? `${reservation.cars.brand} ${reservation.cars.model} ${reservation.cars.license_plate}`.toLowerCase()
        : "";
      const customerName = reservation.customers?.name?.toLowerCase() || "";
      const statusLabel = statusLabels[reservation.status]?.toLowerCase() || "";
      const createdBy = reservation.created_by?.toLowerCase() || "";
      
      return carName.includes(query) ||
        customerName.includes(query) ||
        statusLabel.includes(query) ||
        createdBy.includes(query);
    });
  }, [reservations, searchQuery]);

  // Calcular páginas
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredReservations.slice(start, end);
  }, [filteredReservations, currentPage, itemsPerPage]);

  // Resetar para primeira página quando a lista mudar
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredReservations.length, totalPages, currentPage]);

  // Resetar página quando pesquisa mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    } catch (error: any) {
      logError(error, "ReservationList - Cancel");
      const errorMessage = handleError(error, "Erro ao cancelar reserva");
      toast.error(errorMessage);
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
    } catch (error: any) {
      logError(error, "ReservationList - Delete");
      const errorMessage = handleError(error, "Erro ao remover reserva");
      toast.error(errorMessage);
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma reserva cadastrada ainda
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por carro, cliente, status ou criado por..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            {filteredReservations.length} {filteredReservations.length === 1 ? "reserva encontrada" : "reservas encontradas"}
          </p>
        )}
      </div>

      {filteredReservations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma reserva encontrada com "{searchQuery}"
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carro</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Criado Por</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReservations.map((reservation) => (
              <TableRow 
                key={reservation.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/reservation/${reservation.id}`)}
              >
                <TableCell className="font-medium">
                  {reservation.cars
                    ? `${reservation.cars.brand} ${reservation.cars.model}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {reservation.customers?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {formatAngolaDate(reservation.start_date)} -{" "}
                  {formatAngolaDate(reservation.end_date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {reservation.with_driver ? (
                      <CarTaxiFront className="h-4 w-4" />
                    ) : (
                      <CarFront className="h-4 w-4" />
                    )}
                    <span className="text-xs">
                      {reservation.location_type === "city" ? "Cidade" : "Fora"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {reservation.total_amount.toFixed(2)} AKZ
                </TableCell>
                <TableCell>
                  {(() => {
                    const r = reservation as any;
                    if (r.created_by_user_id && employeeNames.has(r.created_by_user_id)) {
                      return employeeNames.get(r.created_by_user_id);
                    }
                    if (r.created_by_company_user_id && employeeNames.has(r.created_by_company_user_id)) {
                      return employeeNames.get(r.created_by_company_user_id);
                    }
                    return r.created_by || "N/A";
                  })()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[reservation.status]}
                  >
                    {statusLabels[reservation.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(reservation);
                      }}
                      disabled={reservation.status === "cancelled"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {reservation.status !== "cancelled" && reservation.status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelId(reservation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {filteredReservations.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={reservations.length}
        />
      )}

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação alterará o status da reserva para "Cancelada".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta reserva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};