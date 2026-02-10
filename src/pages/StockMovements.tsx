import { useEffect, useState, useMemo, ReactNode } from "react";
import { supabase, withSupabaseLimit } from "@/lib/supabaseSafe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownCircle, ArrowUpCircle, Wrench, Search, Calendar, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Movement {
  id: string;
  type: "ENTRADA" | "SAIDA" | "AJUSTE";
  date: string;
  part_id: string;
  part_name: string;
  part_code: string;
  category_id?: string;
  category_name?: string;
  car_id?: string;
  car_name?: string;
  quantity: number;
  reference_number: string;
  responsible: string;
  description: string;
  status?: string;
  created_at: string;
}

type SortField = "date" | "type" | "part_name" | "quantity" | "reference_number" | "responsible" | "status" | null;
type SortDirection = "asc" | "desc" | null;

const StockMovements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [partFilter, setPartFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [carFilter, setCarFilter] = useState<string>("all");
  const [parts, setParts] = useState<Array<{ id: string; name: string; code: string; category_id: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [cars, setCars] = useState<Array<{ id: string; brand: string; model: string; license_plate: string }>>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchParts();
    const t = window.setTimeout(() => fetchMovements(), 180);
    return () => window.clearTimeout(t);
  }, []);

  const fetchParts = async () => {
    try {
      const { data } = await withSupabaseLimit(() =>
        supabase
          .from("parts")
          .select("id, name, code, category_id")
          .order("name")
      );
      if (data) {
        setParts(data);
      }
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await withSupabaseLimit(() =>
        supabase
          .from("part_categories")
          .select("id, name, code")
          .order("name")
      );
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCars = async () => {
    try {
      const { data } = await withSupabaseLimit(() =>
        supabase
          .from("cars")
          .select("id, brand, model, license_plate")
          .order("license_plate")
      );
      if (data) {
        setCars(data);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      
      // Buscar entradas
      const { data: entries } = await withSupabaseLimit(() =>
        supabase
          .from("stock_entries")
          .select(`
            id,
            entry_number,
            entry_date,
            part_id,
            quantity,
            purchased_by_name,
            notes,
            created_at,
            parts (name, code, category_id, part_categories (name, code))
          `)
          .order("entry_date", { ascending: false })
          .order("created_at", { ascending: false })
      );

      // Buscar saídas
      const { data: exits } = await withSupabaseLimit(() =>
        supabase
          .from("stock_exits")
          .select(`
            id,
            exit_number,
            exit_date,
            part_id,
            car_id,
            quantity,
            requested_by_name,
            delivered_by_name,
            reason,
            status,
            notes,
            created_at,
            parts (name, code, category_id, part_categories (name, code)),
            cars (brand, model, license_plate)
          `)
          .order("exit_date", { ascending: false })
          .order("created_at", { ascending: false })
      );

      // Buscar ajustes
      const { data: adjustments } = await withSupabaseLimit(() =>
        supabase
          .from("stock_adjustments")
          .select(`
            id,
            adjustment_number,
            adjustment_date,
            part_id,
            difference,
            reason_description,
            status,
            notes,
            created_at,
            parts (name, code, category_id, part_categories (name, code))
          `)
          .order("adjustment_date", { ascending: false })
          .order("created_at", { ascending: false })
      );

      // Combinar e transformar dados
      const allMovements: Movement[] = [];

      // Processar entradas
      if (entries) {
        entries.forEach((entry: any) => {
          allMovements.push({
            id: entry.id,
            type: "ENTRADA",
            date: entry.entry_date,
            part_id: entry.part_id,
            part_name: entry.parts?.name || "N/A",
            part_code: entry.parts?.code || "N/A",
            quantity: entry.quantity,
            reference_number: entry.entry_number,
            responsible: entry.purchased_by_name || "N/A",
            description: entry.notes || `Entrada de ${entry.quantity} unidades`,
            created_at: entry.created_at,
          });
        });
      }

      // Processar saídas
      if (exits) {
        exits.forEach((exit: any) => {
          allMovements.push({
            id: exit.id,
            type: "SAIDA",
            date: exit.exit_date,
            part_id: exit.part_id,
            part_name: exit.parts?.name || "N/A",
            part_code: exit.parts?.code || "N/A",
            category_id: exit.parts?.category_id,
            category_name: exit.parts?.part_categories?.name || "N/A",
            car_id: exit.car_id,
            car_name: exit.cars ? `${exit.cars.brand} ${exit.cars.model} - ${exit.cars.license_plate}` : undefined,
            quantity: exit.quantity,
            reference_number: exit.exit_number,
            responsible: exit.delivered_by_name || exit.requested_by_name || "N/A",
            description: exit.reason || exit.notes || `Saída de ${exit.quantity} unidades`,
            status: exit.status,
            created_at: exit.created_at,
          });
        });
      }

      // Processar ajustes
      if (adjustments) {
        adjustments.forEach((adjustment: any) => {
          allMovements.push({
            id: adjustment.id,
            type: "AJUSTE",
            date: adjustment.adjustment_date,
            part_id: adjustment.part_id,
            part_name: adjustment.parts?.name || "N/A",
            part_code: adjustment.parts?.code || "N/A",
            category_id: adjustment.parts?.category_id,
            category_name: adjustment.parts?.part_categories?.name || "N/A",
            quantity: adjustment.difference,
            reference_number: adjustment.adjustment_number,
            responsible: "N/A",
            description: adjustment.reason_description || adjustment.notes || `Ajuste de ${adjustment.difference > 0 ? '+' : ''}${adjustment.difference} unidades`,
            status: adjustment.status,
            created_at: adjustment.created_at,
          });
        });
      }

      setMovements(allMovements);
    } catch (error) {
      console.error("Error fetching movements:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Filtrar por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter((m) => m.type === typeFilter);
    }

    // Filtrar por peça
    if (partFilter !== "all") {
      filtered = filtered.filter((m) => m.part_id === partFilter);
    }

    // Filtrar por categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter((m) => m.category_id === categoryFilter);
    }

    // Filtrar por carro
    if (carFilter !== "all") {
      filtered = filtered.filter((m) => m.car_id === carFilter);
    }

    // Filtrar por pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.part_name.toLowerCase().includes(query) ||
          m.part_code.toLowerCase().includes(query) ||
          m.reference_number.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.responsible.toLowerCase().includes(query) ||
          m.category_name?.toLowerCase().includes(query) ||
          m.car_name?.toLowerCase().includes(query)
      );
    }

    // Ordenar
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "date":
            aValue = new Date(a.date + "T" + (a.created_at ? new Date(a.created_at).toTimeString().split(" ")[0] : "00:00:00"));
            bValue = new Date(b.date + "T" + (b.created_at ? new Date(b.created_at).toTimeString().split(" ")[0] : "00:00:00"));
            break;
          case "type":
            aValue = a.type;
            bValue = b.type;
            break;
          case "part_name":
            aValue = a.part_name.toLowerCase();
            bValue = b.part_name.toLowerCase();
            break;
          case "quantity":
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case "reference_number":
            aValue = a.reference_number.toLowerCase();
            bValue = b.reference_number.toLowerCase();
            break;
          case "responsible":
            aValue = a.responsible.toLowerCase();
            bValue = b.responsible.toLowerCase();
            break;
          case "status":
            aValue = a.status || "";
            bValue = b.status || "";
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Ordenação padrão por data (mais recente primeiro)
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.date + "T" + (a.created_at ? new Date(a.created_at).toTimeString().split(" ")[0] : "00:00:00"));
        const dateB = new Date(b.date + "T" + (b.created_at ? new Date(b.created_at).toTimeString().split(" ")[0] : "00:00:00"));
        return dateB.getTime() - dateA.getTime();
      });
    }

    return filtered;
  }, [movements, typeFilter, partFilter, categoryFilter, carFilter, searchQuery, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredMovements.slice(start, end);
  }, [filteredMovements, currentPage, itemsPerPage]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ENTRADA":
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case "SAIDA":
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case "AJUSTE":
        return <Wrench className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      ENTRADA: "default",
      SAIDA: "destructive",
      AJUSTE: "secondary",
    };
    return (
      <Badge variant={variants[type] || "default"} className="capitalize">
        {type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-AO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: ReactNode }) => {
    const isActive = sortField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1 hover:bg-transparent"
        onClick={() => handleSort(field)}
      >
        {children}
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </Button>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-8">Carregando histórico de movimentos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Histórico de Movimentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Histórico completo de todas as movimentações de stock (entradas, saídas e ajustes)
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar movimentos..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="ENTRADA">Entradas</SelectItem>
                  <SelectItem value="SAIDA">Saídas</SelectItem>
                  <SelectItem value="AJUSTE">Ajustes</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={partFilter}
                onValueChange={(value) => {
                  setPartFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por peça" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Peças</SelectItem>
                  {parts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name} ({part.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={carFilter}
                onValueChange={(value) => {
                  setCarFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por carro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Carros</SelectItem>
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.brand} {car.model} - {car.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Movimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações</CardTitle>
            <CardDescription>
              {filteredMovements.length} {filteredMovements.length === 1 ? "movimentação encontrada" : "movimentações encontradas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton field="date">Data</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="type">Tipo</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="part_name">Peça</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="quantity">Quantidade</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="reference_number">Nº Referência</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="responsible">Responsável</SortButton>
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>
                      <SortButton field="status">Status</SortButton>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchQuery || typeFilter !== "all" || partFilter !== "all"
                          ? "Nenhuma movimentação encontrada"
                          : "Nenhuma movimentação registrada"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMovements.map((movement) => (
                      <TableRow key={`${movement.type}-${movement.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(movement.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(movement.type)}
                            {getTypeBadge(movement.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.part_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {movement.part_code}
                              {movement.category_name && ` • ${movement.category_name}`}
                            </div>
                            {movement.car_name && (
                              <div className="text-xs text-blue-600 mt-1">
                                🚗 {movement.car_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={movement.type === "ENTRADA" ? "text-green-600 font-semibold" : movement.type === "SAIDA" ? "text-red-600 font-semibold" : "text-blue-600 font-semibold"}>
                            {movement.type === "ENTRADA" ? "+" : movement.type === "AJUSTE" && movement.quantity > 0 ? "+" : ""}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{movement.reference_number}</TableCell>
                        <TableCell>{movement.responsible}</TableCell>
                        <TableCell className="max-w-xs truncate" title={movement.description}>
                          {movement.description}
                        </TableCell>
                        <TableCell>
                          {movement.status && (
                            <Badge variant={movement.status === "delivered" || movement.status === "applied" ? "default" : "secondary"}>
                              {movement.status}
                            </Badge>
                          )}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StockMovements;
