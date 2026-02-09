import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Part } from "./PartForm";
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

interface PartListProps {
  parts: Part[];
  loading: boolean;
  onEdit: (part: Part) => void;
  onRefresh: () => void;
}

export const PartList = ({ parts, loading, onEdit, onRefresh }: PartListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Record<string, string>>({});
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from("part_categories").select("id, name");
      if (data) {
        const categoryMap: Record<string, string> = {};
        data.forEach((cat) => {
          categoryMap[cat.id] = cat.name;
        });
        setCategories(categoryMap);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return parts;
    
    const query = searchQuery.toLowerCase();
    return parts.filter(part => 
      part.code.toLowerCase().includes(query) ||
      part.name.toLowerCase().includes(query) ||
      part.car_model_reference?.toLowerCase().includes(query) ||
      part.warehouse_location?.toLowerCase().includes(query)
    );
  }, [parts, searchQuery]);

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const paginatedParts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredParts.slice(start, end);
  }, [filteredParts, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredParts.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      // Verificar se há entradas ou saídas usando esta peça
      const [entriesResult, exitsResult] = await Promise.all([
        supabase.from("stock_entries").select("id").eq("part_id", deleteId).limit(1),
        supabase.from("stock_exits").select("id").eq("part_id", deleteId).limit(1),
      ]);

      if ((entriesResult.data && entriesResult.data.length > 0) || 
          (exitsResult.data && exitsResult.data.length > 0)) {
        toast.error("Não é possível remover peça com movimentações registradas");
        setDeleteId(null);
        return;
      }

      const { error } = await supabase.from("parts").delete().eq("id", deleteId);

      if (error) throw error;

      toast.success("Peça removida com sucesso");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover peça");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando peças...</div>;
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar peças..."
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
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Stock Mín.</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Nenhuma peça encontrada" : "Nenhuma peça cadastrada"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">{part.code}</TableCell>
                  <TableCell>{part.name}</TableCell>
                  <TableCell>{categories[part.category_id] || "-"}</TableCell>
                  <TableCell>{part.car_model_reference || "-"}</TableCell>
                  <TableCell>{part.unit}</TableCell>
                  <TableCell>{part.min_stock}</TableCell>
                  <TableCell>{part.warehouse_location || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={part.is_active ? "default" : "secondary"}>
                      {part.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(part)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(part.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta peça? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
