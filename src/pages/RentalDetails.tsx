import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import Layout from "@/components/Layout";
import { formatAngolaDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface RentalDetails {
  checkout: {
    id: string;
    checkout_date: string;
    initial_km: number;
    delivered_by: string;
    notes: string | null;
  };
  checkin: {
    id: string;
    checkin_date: string;
    final_km: number;
    received_by: string;
    deposit_returned: boolean;
    deposit_returned_amount: number;
    fines_amount: number;
    extra_fees_amount: number;
    notes: string | null;
  } | null;
  reservation: {
    id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    location_type: string;
    with_driver: boolean;
    deposit_paid: boolean;
    notes: string | null;
    created_by: string | null;
    cars: {
      brand: string;
      model: string;
      license_plate: string;
    };
    customers: {
      name: string;
      phone: string;
      email: string | null;
    };
  };
}

const RentalDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rental, setRental] = useState<RentalDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRentalDetails(id);
    }
  }, [id]);

  const fetchRentalDetails = async (reservationId: string) => {
    try {
      // Buscar checkout
      const { data: checkout, error: checkoutError } = await supabase
        .from("checkouts")
        .select("*")
        .eq("reservation_id", reservationId)
        .maybeSingle();

      if (checkoutError && checkoutError.code !== "PGRST116") throw checkoutError;

      // Buscar checkin
      const { data: checkin, error: checkinError } = await supabase
        .from("checkins")
        .select("*")
        .eq("reservation_id", reservationId)
        .maybeSingle();

      if (checkinError && checkinError.code !== "PGRST116") throw checkinError;

      // Buscar reserva
      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate),
          customers (name, phone, email)
        `)
        .eq("id", reservationId)
        .single();

      if (reservationError) throw reservationError;

      if (!checkout) {
        toast.error("Checkout não encontrado para esta reserva");
        navigate("/rentals-summary");
        return;
      }

      setRental({
        checkout: checkout as any,
        checkin: checkin as any,
        reservation: reservation as any,
      });
    } catch (error) {
      console.error("Error fetching rental details:", error);
      toast.error("Erro ao carregar detalhes do aluguer");
      navigate("/rentals-summary");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!rental) return;

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Por favor, permita pop-ups para exportar PDF");
        return;
      }

      const kmDifference = rental.checkin 
        ? rental.checkin.final_km - rental.checkout.initial_km 
        : null;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detalhes do Aluguer - ${format(new Date(), "dd/MM/yyyy")}</title>
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
              .badge-completed {
                background: #10b981;
                color: white;
              }
              .badge-progress {
                background: #f59e0b;
                color: white;
              }
            </style>
          </head>
          <body>
            <h1>Detalhes do Aluguer</h1>
            
            <div class="section">
              <div class="section-title">Informações da Reserva</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Carro</span>
                  <span class="info-value">${rental.reservation.cars ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model}` : "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Matrícula</span>
                  <span class="info-value">${rental.reservation.cars?.license_plate || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Cliente</span>
                  <span class="info-value">${rental.reservation.customers?.name || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Telefone</span>
                  <span class="info-value">${rental.reservation.customers?.phone || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Período</span>
                  <span class="info-value">${formatAngolaDate(rental.reservation.start_date)} - ${formatAngolaDate(rental.reservation.end_date)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total</span>
                  <span class="info-value">${rental.reservation.total_amount.toFixed(2)} AKZ</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value">
                    <span class="badge ${rental.checkin ? "badge-completed" : "badge-progress"}">
                      ${rental.checkin ? "Completo" : "Em Andamento"}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Criado Por</span>
                  <span class="info-value">${rental.reservation.created_by || "N/A"}</span>
                </div>
              </div>
              ${rental.reservation.notes ? `<div class="notes"><strong>Observações:</strong> ${rental.reservation.notes}</div>` : ""}
            </div>

            <div class="section">
              <div class="section-title">Saída do Veículo (Checkout)</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Data de Saída</span>
                  <span class="info-value">${formatAngolaDate(rental.checkout.checkout_date)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Quilometragem Inicial</span>
                  <span class="info-value">${rental.checkout.initial_km.toLocaleString()} km</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Entregado Por</span>
                  <span class="info-value">${rental.checkout.delivered_by}</span>
                </div>
              </div>
              ${rental.checkout.notes ? `<div class="notes"><strong>Observações:</strong> ${rental.checkout.notes}</div>` : ""}
            </div>

            ${rental.checkin ? `
            <div class="section">
              <div class="section-title">Retorno do Veículo (Checkin)</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Data de Retorno</span>
                  <span class="info-value">${formatAngolaDate(rental.checkin.checkin_date)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Quilometragem Final</span>
                  <span class="info-value">${rental.checkin.final_km.toLocaleString()} km</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Quilometragem Percorrida</span>
                  <span class="info-value">${kmDifference ? kmDifference.toLocaleString() : "N/A"} km</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Recebido Por</span>
                  <span class="info-value">${rental.checkin.received_by}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Caução Devolvida</span>
                  <span class="info-value">${rental.checkin.deposit_returned ? "Sim" : "Não"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Valor da Caução Devolvida</span>
                  <span class="info-value">${rental.checkin.deposit_returned_amount.toFixed(2)} AKZ</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Multas</span>
                  <span class="info-value">${rental.checkin.fines_amount.toFixed(2)} AKZ</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Taxas Extras</span>
                  <span class="info-value">${rental.checkin.extra_fees_amount.toFixed(2)} AKZ</span>
                </div>
              </div>
              ${rental.checkin.notes ? `<div class="notes"><strong>Observações:</strong> ${rental.checkin.notes}</div>` : ""}
            </div>
            ` : `
            <div class="section">
              <div class="section-title">Retorno do Veículo (Checkin)</div>
              <p style="color: #f59e0b; font-weight: bold;">Aguardando retorno do veículo</p>
            </div>
            `}

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

  if (!rental) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Aluguer não encontrado</p>
            <Button onClick={() => navigate("/rentals-summary")}>Voltar</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const kmDifference = rental.checkin 
    ? rental.checkin.final_km - rental.checkout.initial_km 
    : null;

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rentals-summary")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">Detalhes do Aluguer</h1>
              <p className="text-muted-foreground">
                {rental.reservation.cars ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model}` : "N/A"} - {rental.reservation.customers?.name || "N/A"}
              </p>
            </div>
          </div>
          <Button onClick={exportToPDF} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        <div className="space-y-6">
          {/* Informações da Reserva */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Reserva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm text-muted-foreground">Carro</Label>
                  <p className="font-semibold">
                    {rental.reservation.cars ? `${rental.reservation.cars.brand} ${rental.reservation.cars.model}` : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Matrícula</Label>
                  <p className="font-semibold">{rental.reservation.cars?.license_plate || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Cliente</Label>
                  <p className="font-semibold">{rental.reservation.customers?.name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Telefone</Label>
                  <p className="font-semibold">{rental.reservation.customers?.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Período</Label>
                  <p className="font-semibold">
                    {formatAngolaDate(rental.reservation.start_date)} - {formatAngolaDate(rental.reservation.end_date)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total</Label>
                  <p className="font-semibold">{rental.reservation.total_amount.toFixed(2)} AKZ</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={rental.checkin ? "default" : "secondary"}>
                      {rental.checkin ? "Completo" : "Em Andamento"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Criado Por</Label>
                  <p className="font-semibold">{rental.reservation.created_by || "N/A"}</p>
                </div>
              </div>
              {rental.reservation.notes && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Observações</Label>
                  <p className="mt-1">{rental.reservation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saída do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Saída do Veículo (Checkout)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm text-muted-foreground">Data de Saída</Label>
                  <p className="font-semibold">{formatAngolaDate(rental.checkout.checkout_date)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Quilometragem Inicial</Label>
                  <p className="font-semibold">{rental.checkout.initial_km.toLocaleString()} km</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Entregado Por</Label>
                  <p className="font-semibold">{rental.checkout.delivered_by}</p>
                </div>
              </div>
              {rental.checkout.notes && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Observações</Label>
                  <p className="mt-1">{rental.checkout.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retorno do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Retorno do Veículo (Checkin)</CardTitle>
            </CardHeader>
            <CardContent>
              {rental.checkin ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm text-muted-foreground">Data de Retorno</Label>
                      <p className="font-semibold">{formatAngolaDate(rental.checkin.checkin_date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Quilometragem Final</Label>
                      <p className="font-semibold">{rental.checkin.final_km.toLocaleString()} km</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Quilometragem Percorrida</Label>
                      <p className="font-semibold">{kmDifference ? `${kmDifference.toLocaleString()} km` : "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Recebido Por</Label>
                      <p className="font-semibold">{rental.checkin.received_by}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Caução Devolvida</Label>
                      <p className="font-semibold">
                        <Badge variant={rental.checkin.deposit_returned ? "default" : "secondary"}>
                          {rental.checkin.deposit_returned ? "Sim" : "Não"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Valor da Caução Devolvida</Label>
                      <p className="font-semibold">{rental.checkin.deposit_returned_amount.toFixed(2)} AKZ</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Multas</Label>
                      <p className="font-semibold">{rental.checkin.fines_amount.toFixed(2)} AKZ</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Taxas Extras</Label>
                      <p className="font-semibold">{rental.checkin.extra_fees_amount.toFixed(2)} AKZ</p>
                    </div>
                  </div>
                  {rental.checkin.notes && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <Label className="text-sm text-muted-foreground">Observações</Label>
                      <p className="mt-1">{rental.checkin.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aguardando retorno do veículo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RentalDetails;

