import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Search, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StockExit } from "./StockExitForm";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StockExitListProps {
  exits: StockExit[];
  loading: boolean;
  onEdit: (exit: StockExit) => void;
  onStatusChange?: (exitId: string, newStatus: string) => void;
  parts: Record<string, string>;
  cars: Record<string, string>;
}

export const StockExitList = ({ exits, loading, onEdit, onStatusChange, parts, cars }: StockExitListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 15;

  const filteredExits = useMemo(() => {
    if (!searchQuery.trim()) return exits;
    
    const query = searchQuery.toLowerCase();
    return exits.filter(exit => 
      exit.exit_number.toLowerCase().includes(query) ||
      parts[exit.part_id]?.toLowerCase().includes(query) ||
      cars[exit.car_id || ""]?.toLowerCase().includes(query)
    );
  }, [exits, searchQuery, parts, cars]);

  const totalPages = Math.ceil(filteredExits.length / itemsPerPage);
  const paginatedExits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredExits.slice(start, end);
  }, [filteredExits, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredExits.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      pending: "secondary",
      delivered: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getExitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      preventive_maintenance: "Manutenção Preventiva",
      corrective_maintenance: "Manutenção Corretiva",
      urgent_repair: "Reparação Urgente",
      internal_use: "Uso Interno",
      other: "Outros",
    };
    return labels[type] || type;
  };

  const handleMarkAsDelivered = async (exit: StockExit) => {
    if (exit.status === 'delivered') {
      toast.info("Esta saída já está marcada como entregue");
      return;
    }

    try {
      const { error } = await supabase
        .from("stock_exits")
        .update({ status: "delivered", updated_at: new Date().toISOString() })
        .eq("id", exit.id);

      if (error) throw error;

      toast.success("Saída marcada como entregue. Stock atualizado.");
      if (onStatusChange) {
        onStatusChange(exit.id, "delivered");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando saídas...</div>;
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar saídas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Peça</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Viatura</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedExits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Nenhuma saída encontrada" : "Nenhuma saída registrada"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedExits.map((exit) => (
                <TableRow key={exit.id}>
                  <TableCell className="font-medium">{exit.exit_number}</TableCell>
                  <TableCell>{new Date(exit.exit_date).toLocaleDateString("pt-AO")}</TableCell>
                  <TableCell>{parts[exit.part_id] || "-"}</TableCell>
                  <TableCell>{exit.quantity}</TableCell>
                  <TableCell>{exit.car_id ? (cars[exit.car_id] || "-") : "-"}</TableCell>
                  <TableCell className="text-sm">{getExitTypeLabel(exit.exit_type)}</TableCell>
                  <TableCell>{getStatusBadge(exit.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {exit.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsDelivered(exit)}
                          title="Marcar como entregue"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Entregar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(exit)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};
