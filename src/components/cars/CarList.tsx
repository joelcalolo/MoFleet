import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Car } from "@/pages/Cars";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
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

interface CarListProps {
  cars: Car[];
  loading: boolean;
  onEdit: (car: Car) => void;
  onRefresh: () => void;
}

export const CarList = ({ cars, loading, onEdit, onRefresh }: CarListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calcular páginas
  const totalPages = Math.ceil(cars.length / itemsPerPage);
  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return cars.slice(start, end);
  }, [cars, currentPage, itemsPerPage]);

  // Resetar para primeira página quando a lista mudar
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [cars.length, totalPages, currentPage]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("cars").delete().eq("id", deleteId);

      if (error) throw error;

      toast.success("Carro removido com sucesso");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover carro");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleAvailability = async (carId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({ is_available: !currentStatus })
        .eq("id", carId);

      if (error) throw error;

      toast.success(`Carro ${!currentStatus ? "disponibilizado" : "indisponibilizado"} com sucesso`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar disponibilidade");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum carro cadastrado ainda
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cidade s/ mot.</TableHead>
              <TableHead className="text-right">Fora s/ mot.</TableHead>
              <TableHead className="text-right">Caução</TableHead>
              <TableHead>Disponível</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCars.map((car) => (
              <TableRow key={car.id}>
                <TableCell className="font-medium">
                  {car.brand} {car.model}
                </TableCell>
                <TableCell>{car.license_plate}</TableCell>
                <TableCell>{car.car_type}</TableCell>
                <TableCell className="text-right">{car.price_city_without_driver.toFixed(2)} AKZ</TableCell>
                <TableCell className="text-right">{car.price_outside_without_driver.toFixed(2)} AKZ</TableCell>
                <TableCell className="text-right">{car.deposit_amount.toFixed(2)} AKZ</TableCell>
                <TableCell>
                  <Switch
                    checked={car.is_available}
                    onCheckedChange={() => handleToggleAvailability(car.id, car.is_available)}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={car.is_available ? "default" : "secondary"}>
                    {car.is_available ? "Disponível" : "Indisponível"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(car)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(car.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {cars.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={cars.length}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este carro? Esta ação não pode ser desfeita.
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