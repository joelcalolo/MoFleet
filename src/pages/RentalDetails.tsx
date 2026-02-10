import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import Layout from "@/components/Layout";
import { formatAngolaDate, parseAngolaDate, calculateExtraDays, getExpectedReturnDateTime } from "@/lib/dateUtils";
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
    driver_name: string | null;
    created_by_user_id: string | null;
    created_by_company_user_id: string | null;
    notes: string | null;
  };
  checkin: {
    id: string;
    checkin_date: string;
    final_km: number;
    received_by: string;
    created_by_user_id: string | null;
    created_by_company_user_id: string | null;
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
      price_city_with_driver?: number;
      price_city_without_driver?: number;
      price_outside_with_driver?: number;
      price_outside_without_driver?: number;
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
      // 1) Buscar checkout e checkin em paralelo
      const [checkoutResult, checkinResult] = await Promise.all([
        supabase.from("checkouts").select("*").eq("reservation_id", reservationId).maybeSingle(),
        supabase.from("checkins").select("*").eq("reservation_id", reservationId).maybeSingle(),
      ]);

      const checkout = checkoutResult.data;
      const checkin = checkinResult.data;
      if (checkoutResult.error && checkoutResult.error.code !== "PGRST116") throw checkoutResult.error;
      if (checkinResult.error && checkinResult.error.code !== "PGRST116") throw checkinResult.error;

      // 2) Buscar reserva
      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate, price_city_with_driver, price_city_without_driver, price_outside_with_driver, price_outside_without_driver, daily_km_limit, extra_km_price),
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

      // 3) Uma única query para todos os company_users necessários
      const companyUserIds = [checkout.created_by_company_user_id, checkin?.created_by_company_user_id]
        .filter(Boolean) as string[];
      let companyUserMap: Record<string, string> = {};
      if (companyUserIds.length > 0) {
        const { data: users } = await supabase
          .from("company_users")
          .select("id, username")
          .in("id", companyUserIds);
        (users || []).forEach((u: any) => { companyUserMap[u.id] = u.username ?? null; });
      }

      const checkoutCreatedBy = checkout.created_by_user_id
        ? "Proprietário"
        : (checkout.created_by_company_user_id ? companyUserMap[checkout.created_by_company_user_id] ?? null : null);
      const checkinCreatedBy = checkin?.created_by_user_id
        ? "Proprietário"
        : (checkin?.created_by_company_user_id ? companyUserMap[checkin.created_by_company_user_id] ?? null : null);

      setRental({
        checkout: { ...checkout as any, created_by_display: checkoutCreatedBy },
        checkin: checkin ? { ...checkin as any, created_by_display: checkinCreatedBy } : null,
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
                ${rental.reservation.with_driver && rental.checkout.driver_name ? `
                <div class="info-item">
                  <span class="info-label">Motorista</span>
                  <span class="info-value">${rental.checkout.driver_name}</span>
                </div>
                ` : ""}
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
                  {(rental.checkout as any).created_by_display && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Registrado por: {(rental.checkout as any).created_by_display}
                    </p>
                  )}
                </div>
                {rental.reservation.with_driver && rental.checkout.driver_name && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Motorista</Label>
                    <p className="font-semibold">{rental.checkout.driver_name}</p>
                  </div>
                )}
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
          {rental.checkin ? (
            <Card>
              <CardHeader>
                <CardTitle>Retorno do Veículo (Checkin)</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Calcular dias extras
                  const start = parseAngolaDate(rental.reservation.start_date);
                  const end = parseAngolaDate(rental.reservation.end_date);
                  const expectedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                  const extraDays = calculateExtraDays(rental.checkout.checkout_date, rental.checkin.checkin_date, expectedDays);
                  const expectedReturn = getExpectedReturnDateTime(rental.checkout.checkout_date, expectedDays);
                  
                  // Calcular valor dos dias extras
                  let extraDaysAmount = 0;
                  const car = rental.reservation.cars;
                  if (car && extraDays > 0) {
                    let dailyRate = 0;
                    if (rental.reservation.location_type === "city") {
                      dailyRate = rental.reservation.with_driver 
                        ? (car.price_city_with_driver || 0)
                        : (car.price_city_without_driver || 0);
                    } else {
                      dailyRate = rental.reservation.with_driver 
                        ? (car.price_outside_with_driver || 0)
                        : (car.price_outside_without_driver || 0);
                    }
                    extraDaysAmount = dailyRate * extraDays;
                  }
                  
                  return (
                    <>
                      {extraDays > 0 && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">⚠️</span>
                            <Label className="text-sm font-semibold text-yellow-800">
                              Retorno após o horário previsto
                            </Label>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-yellow-700 font-medium">Retorno esperado: </span>
                              <span className="text-yellow-800">{format(expectedReturn, "dd/MM/yyyy HH:mm")}</span>
                            </div>
                            <div>
                              <span className="text-yellow-700 font-medium">Retorno real: </span>
                              <span className="text-yellow-800">{format(new Date(rental.checkin.checkin_date), "dd/MM/yyyy HH:mm")}</span>
                            </div>
                            <div>
                              <span className="text-yellow-700 font-medium">Dias extras: </span>
                              <span className="text-yellow-800 font-semibold">{extraDays} dia{extraDays > 1 ? 's' : ''}</span>
                            </div>
                            {extraDaysAmount > 0 && (
                              <div>
                                <span className="text-yellow-700 font-medium">Valor adicional: </span>
                                <span className="text-yellow-800 font-semibold">{extraDaysAmount.toFixed(2)} AKZ</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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
                      {(rental.checkin as any).created_by_display && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Registrado por: {(rental.checkin as any).created_by_display}
                        </p>
                      )}
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Retorno do Veículo (Checkin)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aguardando retorno do veículo</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RentalDetails;

