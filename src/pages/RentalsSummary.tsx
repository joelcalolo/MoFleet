import { useEffect, useState, useMemo } from "react";
import { supabase, withSupabaseLimit } from "@/lib/supabaseSafe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileDown, Filter, ChevronDown, ChevronUp, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@/components/ui/pagination";
import { formatAngolaDate, parseAngolaDate, calculateExtraDays } from "@/lib/dateUtils";
import { format } from "date-fns";

interface RentalSummary {
  id: string;
  reservation_id: string;
  checkout_date: string;
  checkin_date: string | null;
  initial_km: number;
  final_km: number | null;
  delivered_by: string;
  driver_name: string | null;
  received_by: string | null;
  checkout_created_by_user: string | null;
  checkout_created_by_company_user: string | null;
  checkin_created_by_user: string | null;
  checkin_created_by_company_user: string | null;
  deposit_returned: boolean;
  deposit_returned_amount: number;
  fines_amount: number;
  extra_fees_amount: number;
  checkout_notes: string | null;
  checkin_notes: string | null;
  reservation: {
    id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    cars: {
      brand: string;
      model: string;
      license_plate: string;
    };
    customers: {
      name: string;
      phone: string;
    };
  };
}

const RentalsSummary = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<RentalSummary[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<RentalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
    carSearch: "",
    customerSearch: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Calcular páginas para os alugueres filtrados
  const totalPages = Math.ceil(filteredRentals.length / itemsPerPage);
  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRentals.slice(start, end);
  }, [filteredRentals, currentPage, itemsPerPage]);

  // Resetar para primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.startDate, filters.endDate, filters.carSearch, filters.customerSearch, searchQuery]);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      // 1) Buscar todos os checkouts com suas reservas
      const { data: checkouts, error: checkoutError } = await withSupabaseLimit(() =>
        supabase
          .from("checkouts")
          .select(`
            *,
            reservations!inner (
              id,
              start_date,
              end_date,
              total_amount,
              status,
              location_type,
              with_driver,
              cars (brand, model, license_plate, price_city_with_driver, price_city_without_driver, price_outside_with_driver, price_outside_without_driver, daily_km_limit, extra_km_price),
              customers (name, phone)
            )
          `)
          .order("checkout_date", { ascending: false })
      );

      if (checkoutError) throw checkoutError;

      const checkoutList = (checkouts || []) as Array<any>;
      if (checkoutList.length === 0) {
        setRentals([]);
        setFilteredRentals([]);
        return;
      }

      const reservationIds = checkoutList.map((c) => c.reservation_id).filter(Boolean);

      // 2) Buscar todos os checkins de uma vez (evita N+1)
      const { data: checkinsList } = await withSupabaseLimit(() =>
        supabase
          .from("checkins")
          .select("*")
          .in("reservation_id", reservationIds)
      );

      const checkinByReservationId = new Map<string, any>();
      (checkinsList || []).forEach((ch: any) => {
        checkinByReservationId.set(ch.reservation_id, ch);
      });

      const rentalsData: RentalSummary[] = checkoutList.map((checkout) => {
        const checkin = checkinByReservationId.get(checkout.reservation_id) ?? null;
        const checkoutCreatedByUser = checkout.created_by_user_id ? "Proprietário" : null;
        const checkinCreatedByUser = checkin?.created_by_user_id ? "Proprietário" : null;

        return {
          id: checkout.id,
          reservation_id: checkout.reservation_id,
          checkout_date: checkout.checkout_date,
          checkin_date: checkin?.checkin_date ?? null,
          initial_km: checkout.initial_km,
          final_km: checkin?.final_km ?? null,
          delivered_by: checkout.delivered_by || "N/A",
          driver_name: checkout.driver_name ?? null,
          received_by: checkin?.received_by ?? null,
          checkout_created_by_user: checkoutCreatedByUser,
          checkout_created_by_company_user: null,
          checkin_created_by_user: checkinCreatedByUser,
          checkin_created_by_company_user: null,
          deposit_returned: checkin?.deposit_returned ?? false,
          deposit_returned_amount: checkin?.deposit_returned_amount ?? 0,
          fines_amount: checkin?.fines_amount ?? 0,
          extra_fees_amount: checkin?.extra_fees_amount ?? 0,
          checkout_notes: checkout.notes ?? null,
          checkin_notes: checkin?.notes ?? null,
          reservation: checkout.reservations,
        };
        });

      setRentals(rentalsData);
      setFilteredRentals(rentalsData);
    } catch (error) {
      console.error("Error fetching rentals:", error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...rentals];

    // Filtro por status
    if (filters.status !== "all") {
      filtered = filtered.filter(rental => {
        const isCompleted = rental.checkin_date !== null;
        if (filters.status === "completed") return isCompleted;
        if (filters.status === "in_progress") return !isCompleted;
        return true;
      });
    }

    // Filtro por data
    if (filters.startDate) {
      filtered = filtered.filter(rental => {
        const checkoutDate = new Date(rental.checkout_date);
        return checkoutDate >= new Date(filters.startDate);
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(rental => {
        const checkoutDate = new Date(rental.checkout_date);
        return checkoutDate <= new Date(filters.endDate);
      });
    }

    // Filtro por carro
    if (filters.carSearch) {
      filtered = filtered.filter(rental => {
        const carName = `${rental.reservation.cars?.brand} ${rental.reservation.cars?.model} ${rental.reservation.cars?.license_plate}`.toLowerCase();
        return carName.includes(filters.carSearch.toLowerCase());
      });
    }

    // Filtro por cliente
    if (filters.customerSearch) {
      filtered = filtered.filter(rental => {
        const customerName = rental.reservation.customers?.name?.toLowerCase() || "";
        return customerName.includes(filters.customerSearch.toLowerCase());
      });
    }

    // Filtro de pesquisa geral (busca em todos os campos)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rental => {
        // Carro (marca, modelo, matrícula)
        const carInfo = rental.reservation.cars 
          ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model} ${rental.reservation.cars.license_plate}`.toLowerCase()
          : "";
        
        // Cliente (nome, telefone)
        const customerInfo = rental.reservation.customers
          ? `${rental.reservation.customers.name} ${rental.reservation.customers.phone || ""}`.toLowerCase()
          : "";
        
        // Período (datas formatadas)
        const period = `${formatAngolaDate(rental.reservation.start_date)} ${formatAngolaDate(rental.reservation.end_date)}`.toLowerCase();
        
        // Datas de checkout e checkin
        const checkoutDate = rental.checkout_date ? formatAngolaDate(rental.checkout_date).toLowerCase() : "";
        const checkinDate = rental.checkin_date ? formatAngolaDate(rental.checkin_date).toLowerCase() : "";
        
        // Entregado por / Recebido por
        const deliveredBy = (rental.delivered_by || "").toLowerCase();
        const receivedBy = (rental.received_by || "").toLowerCase();
        
        // KM inicial e final
        const kmInfo = `${rental.initial_km} ${rental.final_km || ""}`.toLowerCase();
        
        // Status
        const status = rental.checkin_date ? "completo" : "em andamento";
        
        // Observações
        const notes = `${rental.checkout_notes || ""} ${rental.checkin_notes || ""}`.toLowerCase();
        
        // Verificar se a query está em algum dos campos
        return carInfo.includes(query) ||
          customerInfo.includes(query) ||
          period.includes(query) ||
          checkoutDate.includes(query) ||
          checkinDate.includes(query) ||
          deliveredBy.includes(query) ||
          receivedBy.includes(query) ||
          kmInfo.includes(query) ||
          status.includes(query) ||
          notes.includes(query);
      });
    }

    setFilteredRentals(filtered);
  }, [filters, rentals, searchQuery]);

  const calculateKmDifference = (initial: number, final: number | null): number | null => {
    if (final === null) return null;
    return final - initial;
  };

  const exportToPDF = () => {
    try {
      // Criar uma nova janela para impressão
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Por favor, permita pop-ups para exportar PDF");
        return;
      }

      const rentalRows = filteredRentals.map((rental, index) => {
        const kmDifference = calculateKmDifference(rental.initial_km, rental.final_km);
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${rental.reservation.cars ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model}` : "N/A"}</td>
            <td>${rental.reservation.cars?.license_plate || "N/A"}</td>
            <td>${rental.reservation.customers?.name || "N/A"}</td>
            <td>${formatAngolaDate(rental.reservation.start_date)}</td>
            <td>${formatAngolaDate(rental.reservation.end_date)}</td>
            <td>${rental.checkout_date ? formatAngolaDate(rental.checkout_date) : "N/A"}</td>
            <td>${rental.checkin_date ? formatAngolaDate(rental.checkin_date) : "Pendente"}</td>
            <td>${rental.delivered_by}</td>
            <td>${rental.received_by || "-"}</td>
            <td>${rental.initial_km.toLocaleString()}</td>
            <td>${rental.final_km !== null ? rental.final_km.toLocaleString() : "-"}</td>
            <td>${kmDifference !== null ? kmDifference.toLocaleString() : "-"}</td>
            <td>${rental.deposit_returned ? "Sim" : "Não"}</td>
            <td>${rental.deposit_returned_amount.toFixed(2)}</td>
            <td>${rental.fines_amount.toFixed(2)}</td>
            <td>${rental.extra_fees_amount.toFixed(2)}</td>
            <td>${rental.checkin_date ? "Completo" : "Em Andamento"}</td>
          </tr>
        `;
      }).join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Resumo de Alugueres - ${format(new Date(), "dd/MM/yyyy")}</title>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { margin: 0; }
              }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                font-size: 10px;
              }
              h1 {
                text-align: center;
                margin-bottom: 20px;
                font-size: 18px;
              }
              .filters {
                margin-bottom: 15px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 5px;
                font-size: 9px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 6px;
                text-align: left;
              }
              th {
                background-color: #4f46e5;
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 9px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h1>Resumo de Alugueres</h1>
            <div class="filters">
              <strong>Filtros Aplicados:</strong><br>
              Status: ${filters.status === "all" ? "Todos" : filters.status === "completed" ? "Completos" : "Em Andamento"} | 
              ${filters.startDate ? `De: ${formatAngolaDate(filters.startDate)}` : ""} 
              ${filters.endDate ? `Até: ${formatAngolaDate(filters.endDate)}` : ""}
              ${filters.carSearch ? ` | Carro: ${filters.carSearch}` : ""}
              ${filters.customerSearch ? ` | Cliente: ${filters.customerSearch}` : ""}
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Carro</th>
                  <th>Matrícula</th>
                  <th>Cliente</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Saída</th>
                  <th>Retorno</th>
                  <th>Entregado Por</th>
                  <th>Recebido Por</th>
                  <th>KM Inicial</th>
                  <th>KM Final</th>
                  <th>KM Percorrido</th>
                  <th>Caução</th>
                  <th>Valor Caução</th>
                  <th>Multas</th>
                  <th>Taxas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${rentalRows}
              </tbody>
            </table>
            <div class="footer">
              Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} | Total de registros: ${filteredRentals.length}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success("PDF gerado! Use a opção 'Salvar como PDF' na janela de impressão.");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "Carro",
        "Matrícula",
        "Cliente",
        "Telefone",
        "Período Início",
        "Período Fim",
        "Data Saída",
        "Data Retorno",
        "Entregado Por",
        "Recebido Por",
        "KM Inicial",
        "KM Final",
        "KM Percorrido",
        "Caução Devolvida",
        "Valor Caução",
        "Multas (AKZ)",
        "Taxas Extras (AKZ)",
        "Status",
        "Observações Saída",
        "Observações Retorno",
      ];

      const rows = filteredRentals.map((rental) => {
        const kmDifference = calculateKmDifference(rental.initial_km, rental.final_km);
        return [
          rental.reservation.cars ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model}` : "N/A",
          rental.reservation.cars?.license_plate || "N/A",
          rental.reservation.customers?.name || "N/A",
          rental.reservation.customers?.phone || "N/A",
          formatAngolaDate(rental.reservation.start_date),
          formatAngolaDate(rental.reservation.end_date),
          rental.checkout_date ? formatAngolaDate(rental.checkout_date) : "N/A",
          rental.checkin_date ? formatAngolaDate(rental.checkin_date) : "Pendente",
          rental.delivered_by,
          rental.received_by || "N/A",
          rental.initial_km.toString(),
          rental.final_km !== null ? rental.final_km.toString() : "N/A",
          kmDifference !== null ? kmDifference.toString() : "N/A",
          rental.deposit_returned ? "Sim" : "Não",
          rental.deposit_returned_amount.toFixed(2),
          rental.fines_amount.toFixed(2),
          rental.extra_fees_amount.toFixed(2),
          rental.checkin_date ? "Completo" : "Em Andamento",
          rental.checkout_notes || "",
          rental.checkin_notes || "",
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `resumo_alugueres_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Resumo de Alugueres</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Histórico completo de saídas e retornos de carros</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-3 w-3" />
              CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileDown className="mr-2 h-3 w-3" />
              PDF
            </Button>
          </div>
        </div>

        {/* Barra de Pesquisa Geral */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por carro, cliente, período, entregado por, recebido por, KM, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredRentals.length} {filteredRentals.length === 1 ? "aluguer encontrado" : "alugueres encontrados"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="mb-6">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                  {filtersOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Completos</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carSearch">Buscar Carro</Label>
                <Input
                  id="carSearch"
                  type="text"
                  placeholder="Marca, modelo ou matrícula"
                  value={filters.carSearch}
                  onChange={(e) => setFilters({ ...filters, carSearch: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerSearch">Buscar Cliente</Label>
                <Input
                  id="customerSearch"
                  type="text"
                  placeholder="Nome do cliente"
                  value={filters.customerSearch}
                  onChange={(e) => setFilters({ ...filters, customerSearch: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({
                  status: "all",
                  startDate: "",
                  endDate: "",
                  carSearch: "",
                  customerSearch: "",
                })}
              >
                Limpar Filtros
              </Button>
            </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Alugueres ({filteredRentals.length} de {rentals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRentals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aluguer registrado ainda
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carro</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Data Saída</TableHead>
                      <TableHead>Data Retorno</TableHead>
                      <TableHead>Entregado Por</TableHead>
                      <TableHead>Recebido Por</TableHead>
                      <TableHead>KM Inicial</TableHead>
                      <TableHead>KM Final</TableHead>
                      <TableHead>KM Percorrido</TableHead>
                      <TableHead>Caução Devolvida</TableHead>
                      <TableHead>Multas</TableHead>
                      <TableHead>Taxas Extras</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                      {paginatedRentals.map((rental) => {
                      const kmDifference = calculateKmDifference(rental.initial_km, rental.final_km);
                      const isCompleted = rental.checkin_date !== null;
                      
                      // Calcular dias extras
                      let extraDays = 0;
                      if (rental.checkout_date && rental.checkin_date) {
                        const start = parseAngolaDate(rental.reservation.start_date);
                        const end = parseAngolaDate(rental.reservation.end_date);
                        const expectedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        extraDays = calculateExtraDays(rental.checkout_date, rental.checkin_date, expectedDays);
                      }

                      return (
                        <TableRow 
                          key={rental.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/rental/${rental.reservation_id}`)}
                        >
                          <TableCell className="font-medium">
                            {rental.reservation.cars
                              ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model}`
                              : "N/A"}
                            <div className="text-xs text-muted-foreground">
                              {rental.reservation.cars?.license_plate || ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{rental.reservation.customers?.name || "N/A"}</div>
                            <div className="text-xs text-muted-foreground">
                              {rental.reservation.customers?.phone || ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatAngolaDate(rental.reservation.start_date)} -{" "}
                            {formatAngolaDate(rental.reservation.end_date)}
                          </TableCell>
                          <TableCell>
                            {rental.checkout_date
                              ? formatAngolaDate(rental.checkout_date)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {rental.checkin_date
                              ? formatAngolaDate(rental.checkin_date)
                              : <Badge variant="outline">Pendente</Badge>}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rental.delivered_by}</div>
                              {(rental.checkout_created_by_user || rental.checkout_created_by_company_user) && (
                                <div className="text-xs text-muted-foreground">
                                  Registrado por: {rental.checkout_created_by_company_user || rental.checkout_created_by_user}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {rental.received_by ? (
                              <div>
                                <div className="font-medium">{rental.received_by}</div>
                                {(rental.checkin_created_by_user || rental.checkin_created_by_company_user) && (
                                  <div className="text-xs text-muted-foreground">
                                    Registrado por: {rental.checkin_created_by_company_user || rental.checkin_created_by_user}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{rental.initial_km.toLocaleString()} km</TableCell>
                          <TableCell>
                            {rental.final_km !== null
                              ? `${rental.final_km.toLocaleString()} km`
                              : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {kmDifference !== null
                              ? `${kmDifference.toLocaleString()} km`
                              : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {rental.deposit_returned ? (
                              <div>
                                <Badge variant="default" className="mb-1">Sim</Badge>
                                <div className="text-xs font-semibold">
                                  {rental.deposit_returned_amount.toFixed(2)} AKZ
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {rental.fines_amount > 0
                              ? `${rental.fines_amount.toFixed(2)} AKZ`
                              : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {rental.extra_fees_amount > 0 ? (
                              <div>
                                <div className="font-semibold">
                                  {rental.extra_fees_amount.toFixed(2)} AKZ
                                </div>
                                {extraDays > 0 && (
                                  <div className="text-xs text-yellow-600 font-medium">
                                    ({extraDays} dia{extraDays > 1 ? 's' : ''} extra{extraDays > 1 ? 's' : ''})
                                  </div>
                                )}
                              </div>
                            ) : (
                              extraDays > 0 ? (
                                <div className="text-xs text-yellow-600 font-medium">
                                  {extraDays} dia{extraDays > 1 ? 's' : ''} extra{extraDays > 1 ? 's' : ''}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isCompleted ? "default" : "secondary"}
                            >
                              {isCompleted ? "Completo" : "Em Andamento"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {filteredRentals.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredRentals.length}
              />
            )}
          </CardContent>
        </Card>

        {/* Observações em cards separados para melhor visualização */}
        {rentals.some(r => r.checkout_notes || r.checkin_notes) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rentals
                  .filter(r => r.checkout_notes || r.checkin_notes)
                  .map((rental) => (
                    <div key={rental.id} className="border rounded-lg p-4">
                      <div className="font-medium mb-2">
                        {rental.reservation.cars
                          ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model}`
                          : "Carro N/A"}{" "}
                        - {rental.reservation.customers?.name || "Cliente N/A"}
                      </div>
                      {rental.checkout_notes && (
                        <div className="mb-2">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Observações na Saída:
                          </span>
                          <p className="text-sm mt-1">{rental.checkout_notes}</p>
                        </div>
                      )}
                      {rental.checkin_notes && (
                        <div>
                          <span className="text-sm font-semibold text-muted-foreground">
                            Observações no Retorno:
                          </span>
                          <p className="text-sm mt-1">{rental.checkin_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RentalsSummary;

