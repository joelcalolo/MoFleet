import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Search } from "lucide-react";
import { StockEntry } from "./StockEntryForm";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StockEntryListProps {
  entries: StockEntry[];
  loading: boolean;
  onEdit: (entry: StockEntry) => void;
  suppliers: Record<string, string>;
  parts: Record<string, string>;
}

export const StockEntryList = ({ entries, loading, onEdit, suppliers, parts }: StockEntryListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 15;

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter(entry => 
      entry.entry_number.toLowerCase().includes(query) ||
      suppliers[entry.supplier_id]?.toLowerCase().includes(query) ||
      parts[entry.part_id]?.toLowerCase().includes(query) ||
      entry.invoice_number?.toLowerCase().includes(query)
    );
  }, [entries, searchQuery, suppliers, parts]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredEntries.slice(start, end);
  }, [filteredEntries, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredEntries.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return <div className="text-center py-8">Carregando entradas...</div>;
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar entradas..."
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
              <TableHead>Fornecedor</TableHead>
              <TableHead>Peça</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Preço Unit.</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fatura</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Nenhuma entrada encontrada" : "Nenhuma entrada registrada"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.entry_number}</TableCell>
                  <TableCell>{new Date(entry.entry_date).toLocaleDateString("pt-AO")}</TableCell>
                  <TableCell>{suppliers[entry.supplier_id] || "-"}</TableCell>
                  <TableCell>{parts[entry.part_id] || "-"}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-AO", {
                      style: "currency",
                      currency: "AOA",
                      minimumFractionDigits: 0,
                    }).format(entry.unit_price)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat("pt-AO", {
                      style: "currency",
                      currency: "AOA",
                      minimumFractionDigits: 0,
                    }).format(entry.total_price)}
                  </TableCell>
                  <TableCell>{entry.invoice_number || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(entry)}
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
