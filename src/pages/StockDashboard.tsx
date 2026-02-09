import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, Search, TrendingDown, TrendingUp, History, ArrowUpCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CurrentStock {
  part_id: string;
  part_code: string;
  part_name: string;
  category_name: string;
  category_code: string;
  unit: string;
  min_stock: number;
  warehouse_location: string | null;
  average_price: number;
  current_stock: number;
  status_stock: string;
  total_entries: number;
  total_exits_delivered: number;
  total_adjustments_applied: number;
  last_entry_date: string | null;
  last_exit_date: string | null;
  total_value: number;
}

interface RecentExit {
  id: string;
  exit_number: string;
  exit_date: string;
  part_name: string;
  quantity: number;
  reason: string | null;
  status: string;
}

const StockDashboard = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState<CurrentStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [recentExits, setRecentExits] = useState<RecentExit[]>([]);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchStock();
    fetchRecentExits();
  }, []);

  const fetchRecentExits = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_exits")
        .select(`
          id,
          exit_number,
          exit_date,
          quantity,
          reason,
          status,
          parts (name)
        `)
        .order("exit_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      const exits: RecentExit[] = (data || []).map((exit: any) => ({
        id: exit.id,
        exit_number: exit.exit_number,
        exit_date: exit.exit_date,
        part_name: exit.parts?.name || "N/A",
        quantity: exit.quantity,
        reason: exit.reason,
        status: exit.status,
      }));

      setRecentExits(exits);
    } catch (error) {
      console.error("Error fetching recent exits:", error);
    }
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("current_stock")
        .select("*")
        .order("part_name", { ascending: true });

      if (error) {
        console.error("Error fetching stock:", error);
        // Se a view não existir, mostrar mensagem útil
        if (error.code === 'PGRST205' || error.message?.includes('not found') || error.message?.includes('Could not find')) {
          setError("A view 'current_stock' não foi encontrada. Por favor, execute todas as migrações do banco de dados.");
        } else {
          setError(`Erro ao carregar stock: ${error.message}`);
        }
        setStock([]);
        return;
      }
      setError(null);
      setStock(data || []);
    } catch (error) {
      console.error("Error fetching stock:", error);
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = useMemo(() => {
    let filtered = stock;

    // Filtrar por pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.part_code.toLowerCase().includes(query) ||
          item.part_name.toLowerCase().includes(query) ||
          item.category_name.toLowerCase().includes(query) ||
          item.warehouse_location?.toLowerCase().includes(query)
      );
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status_stock === statusFilter);
    }

    return filtered;
  }, [stock, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const paginatedStock = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredStock.slice(start, end);
  }, [filteredStock, currentPage, itemsPerPage]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalItems = stock.length;
    const criticalItems = stock.filter((s) => s.status_stock === "CRITICO").length;
    const lowItems = stock.filter((s) => s.status_stock === "BAIXO").length;
    const outOfStockItems = stock.filter((s) => s.status_stock === "ESGOTADO").length;
    const totalValue = stock.reduce((sum, s) => sum + (s.total_value || 0), 0);

    return {
      totalItems,
      criticalItems,
      lowItems,
      outOfStockItems,
      totalValue,
    };
  }, [stock]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      ESGOTADO: "destructive",
      CRITICO: "destructive",
      BAIXO: "secondary",
      OK: "default",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-8">Carregando stock...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao Carregar Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Certifique-se de que todas as migrações do banco de dados foram executadas, especialmente:
                <br />- 20260209000007_create_current_stock_view.sql
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard de Stock</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Visão geral do inventário atual com alertas e estatísticas
              </p>
            </div>
            <Button
              onClick={() => navigate("/inventory/movements")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <History className="mr-2 h-4 w-4" />
              Histórico de Movimentos
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esgotadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.outOfStockItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.criticalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Baixas</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-AO", {
                  style: "currency",
                  currency: "AOA",
                  minimumFractionDigits: 0,
                }).format(stats.totalValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Últimas Saídas */}
        {recentExits.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Últimas Saídas</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/inventory/exits")}
                >
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExits.map((exit) => (
                  <div
                    key={exit.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/inventory/exits")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-muted-foreground">
                          {exit.exit_number}
                        </span>
                        <Badge variant={exit.status === "delivered" ? "default" : "secondary"}>
                          {exit.status === "delivered" ? "Entregue" : exit.status === "pending" ? "Pendente" : "Cancelado"}
                        </Badge>
                      </div>
                      <div className="font-medium mb-1">{exit.part_name}</div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Quantidade: {exit.quantity} • {new Date(exit.exit_date).toLocaleDateString("pt-AO")}
                      </div>
                      {exit.reason && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {exit.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar peças..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ESGOTADO">Esgotado</SelectItem>
                  <SelectItem value="CRITICO">Crítico</SelectItem>
                  <SelectItem value="BAIXO">Baixo</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Atual</CardTitle>
            <CardDescription>
              {filteredStock.length} {filteredStock.length === 1 ? "peça encontrada" : "peças encontradas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Stock Atual</TableHead>
                    <TableHead>Stock Mín.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preço Médio</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Localização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhuma peça encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStock.map((item) => (
                      <TableRow key={item.part_id}>
                        <TableCell className="font-medium">{item.part_code}</TableCell>
                        <TableCell>{item.part_name}</TableCell>
                        <TableCell>{item.category_name}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{item.current_stock.toFixed(2)}</span>{" "}
                          <span className="text-muted-foreground">{item.unit}</span>
                        </TableCell>
                        <TableCell>{item.min_stock}</TableCell>
                        <TableCell>{getStatusBadge(item.status_stock)}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-AO", {
                            style: "currency",
                            currency: "AOA",
                            minimumFractionDigits: 0,
                          }).format(item.average_price)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-AO", {
                            style: "currency",
                            currency: "AOA",
                            minimumFractionDigits: 0,
                          }).format(item.total_value || 0)}
                        </TableCell>
                        <TableCell>{item.warehouse_location || "-"}</TableCell>
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

export default StockDashboard;
