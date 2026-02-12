import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Edit } from "lucide-react";
import Layout from "@/components/Layout";
import { formatAngolaDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Reservation } from "@/pages/Reservations";
import { Label } from "@/components/ui/label";
import { getEmployeeName } from "@/lib/userUtils";

const ReservationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckout, setHasCheckout] = useState(false);
  const [hasCheckin, setHasCheckin] = useState(false);
  const [createdByName, setCreatedByName] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReservationDetails(id);
    }
  }, [id]);

  const fetchReservationDetails = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate),
          customers (name, phone, email)
        `)
        .eq("id", reservationId)
        .single();

      if (error) throw error;

      const reservationData = data as Reservation & {
        created_by_user_id?: string | null;
        created_by_company_user_id?: string | null;
      };

      setReservation(reservationData);

      // Buscar nome do funcionário que criou a reserva
      if (reservationData.created_by_user_id || reservationData.created_by_company_user_id) {
        const name = await getEmployeeName(
          reservationData.created_by_user_id || null,
          reservationData.created_by_company_user_id || null
        );
        setCreatedByName(name);
      } else if (reservationData.created_by) {
        // Fallback para campo antigo created_by (texto)
        setCreatedByName(reservationData.created_by);
      }

      // Verificar se tem checkout e checkin
      const { data: checkout } = await supabase
        .from("checkouts")
        .select("id")
        .eq("reservation_id", reservationId)
        .maybeSingle();

      const { data: checkin } = await supabase
        .from("checkins")
        .select("id")
        .eq("reservation_id", reservationId)
        .maybeSingle();

      setHasCheckout(!!checkout);
      setHasCheckin(!!checkin);
    } catch (error) {
      console.error("Error fetching reservation details:", error);
      toast.error("Erro ao carregar detalhes da reserva");
      navigate("/reservations");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reservation) return;

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Por favor, permita pop-ups para exportar PDF");
        return;
      }

      const statusLabels: Record<string, string> = {
        pending: "Pendente",
        confirmed: "Confirmada",
        active: "Em Andamento",
        completed: "Concluída",
        cancelled: "Cancelada",
      };

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detalhes da Reserva - ${format(new Date(), "dd/MM/yyyy")}</title>
            <style>
              @media print {
                @page { margin: 1.5cm; }
                body { margin: 0; }
              }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                font-size: 12px;
                line-height: 1.6;
              }
              h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 24px;
                color: #1f2937;
              }
              .section {
                margin-bottom: 25px;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: #f9fafb;
              }
              .section-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #4f46e5;
                border-bottom: 2px solid #4f46e5;
                padding-bottom: 5px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 10px;
              }
              .info-item {
                display: flex;
                flex-direction: column;
              }
              .info-label {
                font-weight: bold;
                color: #6b7280;
                font-size: 10px;
                margin-bottom: 3px;
              }
              .info-value {
                font-size: 12px;
                color: #1f2937;
              }
              .notes {
                margin-top: 10px;
                padding: 10px;
                background: white;
                border-left: 3px solid #4f46e5;
                font-style: italic;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
                padding-top: 15px;
              }
              .badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
              }
              .badge-pending { background: #fbbf24; color: white; }
              .badge-confirmed { background: #3b82f6; color: white; }
              .badge-active { background: #10b981; color: white; }
              .badge-completed { background: #6b7280; color: white; }
              .badge-cancelled { background: #ef4444; color: white; }
            </style>
          </head>
          <body>
            <h1>Detalhes da Reserva</h1>
            
            <div class="section">
              <div class="section-title">Informações da Reserva</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Carro</span>
                  <span class="info-value">${reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Matrícula</span>
                  <span class="info-value">${reservation.cars?.license_plate || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Cliente</span>
                  <span class="info-value">${reservation.customers?.name || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Telefone</span>
                  <span class="info-value">${reservation.customers?.phone || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Período</span>
                  <span class="info-value">${formatAngolaDate(reservation.start_date)} - ${formatAngolaDate(reservation.end_date)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total</span>
                  <span class="info-value">${reservation.total_amount.toFixed(2)} AKZ</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value">
                    <span class="badge badge-${reservation.status}">
                      ${statusLabels[reservation.status] || reservation.status}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tipo de Localização</span>
                  <span class="info-value">${reservation.location_type === "city" ? "Cidade" : "Fora"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Com Motorista</span>
                  <span class="info-value">${reservation.with_driver ? "Sim" : "Não"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Caução Paga</span>
                  <span class="info-value">${reservation.deposit_paid ? "Sim" : "Não"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Criado Por</span>
                  <span class="info-value">${createdByName || reservation.created_by || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Checkout</span>
                  <span class="info-value">${hasCheckout ? "Realizado" : "Não realizado"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Checkin</span>
                  <span class="info-value">${hasCheckin ? "Realizado" : "Não realizado"}</span>
                </div>
              </div>
              ${reservation.notes ? `<div class="notes"><strong>Observações:</strong> ${reservation.notes}</div>` : ""}
            </div>

            <div class="footer">
              Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} | MoFleet Sistema de Gestão
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

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (!reservation) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Reserva não encontrada</p>
            <Button onClick={() => navigate("/reservations")}>Voltar</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    active: "Em Andamento",
    completed: "Concluída",
    cancelled: "Cancelada",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    active: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/reservations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">Detalhes da Reserva</h1>
              <p className="text-muted-foreground">
                {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "N/A"} - {reservation.customers?.name || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/reservations?edit=${reservation.id}`)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar Reserva
            </Button>
            <Button onClick={exportToPDF} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-muted-foreground">Carro</Label>
                <p className="font-semibold">
                  {reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Matrícula</Label>
                <p className="font-semibold">{reservation.cars?.license_plate || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Cliente</Label>
                <p className="font-semibold">{reservation.customers?.name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Telefone</Label>
                <p className="font-semibold">{reservation.customers?.phone || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Período</Label>
                <p className="font-semibold">
                  {formatAngolaDate(reservation.start_date)} - {formatAngolaDate(reservation.end_date)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Total</Label>
                <p className="font-semibold">{reservation.total_amount.toFixed(2)} AKZ</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div>
                  <Badge className={statusColors[reservation.status]}>
                    {statusLabels[reservation.status] || reservation.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Tipo de Localização</Label>
                <p className="font-semibold">{reservation.location_type === "city" ? "Cidade" : "Fora"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Com Motorista</Label>
                <p className="font-semibold">{reservation.with_driver ? "Sim" : "Não"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Caução Paga</Label>
                <p className="font-semibold">
                  <Badge variant={reservation.deposit_paid ? "default" : "secondary"}>
                    {reservation.deposit_paid ? "Sim" : "Não"}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Criado Por</Label>
                <p className="font-semibold">{createdByName || reservation.created_by || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Checkout</Label>
                <p className="font-semibold">
                  <Badge variant={hasCheckout ? "default" : "secondary"}>
                    {hasCheckout ? "Realizado" : "Não realizado"}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Checkin</Label>
                <p className="font-semibold">
                  <Badge variant={hasCheckin ? "default" : "secondary"}>
                    {hasCheckin ? "Realizado" : "Não realizado"}
                  </Badge>
                </p>
              </div>
            </div>
            {reservation.notes && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">Observações</Label>
                <p className="mt-1">{reservation.notes}</p>
              </div>
            )}
            {hasCheckout && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/rental/${reservation.id}`)}
                  className="w-full"
                >
                  Ver Detalhes do Aluguer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReservationDetails;

