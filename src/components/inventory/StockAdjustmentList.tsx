import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Search } from "lucide-react";
import { StockAdjustment } from "./StockAdjustmentForm";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StockAdjustmentListProps {
  adjustments: StockAdjustment[];
  loading: boolean;
  onEdit: (adjustment: StockAdjustment) => void;
  parts: Record<string, string>;
}

export const StockAdjustmentList = ({ adjustments, loading, onEdit, parts }: StockAdjustmentListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 15;

  const filteredAdjustments = useMemo(() => {
    if (!searchQuery.trim()) return adjustments;
    
    const query = searchQuery.toLowerCase();
    return adjustments.filter(adj => 
      adj.adjustment_number.toLowerCase().includes(query) ||
      parts[adj.part_id]?.toLowerCase().includes(query)
    );
  }, [adjustments, searchQuery, parts]);

  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage);
  const paginatedAdjustments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAdjustments.slice(start, end);
  }, [filteredAdjustments, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredAdjustments.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      pending: "secondary",
      applied: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      physical_count: "Contagem Física",
      loss: "Perda",
      theft: "Roubo",
      damage: "Danificação",
      registration_error: "Erro de Registo",
      other: "Outros",
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando ajustes...</div>;
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar ajustes..."
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
              <TableHead>Stock Sistema</TableHead>
              <TableHead>Stock Físico</TableHead>
              <TableHead>Diferença</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAdjustments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Nenhum ajuste encontrado" : "Nenhum ajuste registrado"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedAdjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell className="font-medium">{adjustment.adjustment_number}</TableCell>
                  <TableCell>{new Date(adjustment.adjustment_date).toLocaleDateString("pt-AO")}</TableCell>
                  <TableCell>{parts[adjustment.part_id] || "-"}</TableCell>
                  <TableCell>{adjustment.system_stock.toFixed(2)}</TableCell>
                  <TableCell>{adjustment.physical_stock.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={adjustment.difference >= 0 ? "text-green-600" : "text-red-600"}>
                      {adjustment.difference >= 0 ? "+" : ""}{adjustment.difference.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{getReasonLabel(adjustment.reason)}</TableCell>
                  <TableCell>{getStatusBadge(adjustment.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(adjustment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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
