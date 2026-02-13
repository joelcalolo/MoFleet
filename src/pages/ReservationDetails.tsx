import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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

interface CompanyData {
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string;
  address: string | null;
}

const ReservationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckout, setHasCheckout] = useState(false);
  const [hasCheckin, setHasCheckin] = useState(false);
  const [createdByName, setCreatedByName] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReservationDetails(id);
    }
  }, [id]);

  useEffect(() => {
    supabase
      .from("companies")
      .select("name, logo_url, phone, email, address")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCompany(data as CompanyData);
        else setCompany(null);
      });
  }, []);

  const fetchReservationDetails = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate, car_type, transmission, fuel_type),
          customers (name, phone, email, id_document)
        `)
        .eq("id", reservationId)
        .single();

      if (error) throw error;

      const reservationData = data as Reservation & {
        created_by_user_id?: string | null;
        created_by_company_user_id?: string | null;
        cars?: { brand: string; model: string; license_plate: string; car_type?: string; transmission?: string; fuel_type?: string };
        customers?: { name: string; phone: string; email?: string; id_document?: string };
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

      const startDate = new Date(reservation.start_date);
      const endDate = new Date(reservation.end_date);
      const numberOfDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyRate = reservation.total_amount / numberOfDays;
      const reservationNumber = reservation.id.slice(-8).toUpperCase();
      const verificationCode = reservation.id.replace(/-/g, "").slice(-8).toUpperCase();
      const qrData = encodeURIComponent(verificationCode);
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
      const companyName = company?.name || "FórmulaSul Rent-a-Car";
      const slogan = "Contigo a cada quilómetro";
      const pickupLocation = company?.address || "Escritório";
      const returnLocation = company?.address || "Escritório";
      const hasTime = String(reservation.start_date).includes("T");
      const pickupTime = hasTime ? format(startDate, "HH:mm") : "A combinar";
      const returnTime = hasTime ? format(endDate, "HH:mm") : "A combinar";

      const logoImg = company?.logo_url
        ? `<img src="${company.logo_url}" alt="${companyName}" class="doc-logo" />`
        : "";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt">
          <head>
            <meta charset="utf-8" />
            <title>Comprovativo de Reserva - ${reservationNumber}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <style>
              @media print {
                @page { margin: 12mm; size: A4; }
                body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .page-wrap { break-inside: avoid; }
                .watermark { opacity: 0.06 !important; }
              }
              * { box-sizing: border-box; }
              body {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 10px;
                line-height: 1.35;
                color: #1f2937;
                margin: 0;
                background: #fff;
              }
              .doc-page {
                display: flex;
                min-height: 100vh;
                max-width: 210mm;
                margin: 0 auto;
              }
              .doc-bar {
                width: 6px;
                flex-shrink: 0;
                background: #1e3a5f;
              }
              .doc-body { flex: 1; padding: 0 0 0 16px; }
              .watermark {
                position: fixed;
                bottom: 1mm;
                right: 4mm;
                width: 400px;
                max-width: 400px;
                opacity: 0.06;
                pointer-events: none;
                z-index: 0;
              }
              .watermark img { width: 100%; height: auto; }
              .content { position: relative; z-index: 1; }
              .doc-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 14px;
                padding-bottom: 10px;
                border-bottom: 2px solid #1e3a5f;
              }
              .doc-logo { max-height: 40px; width: auto; margin-bottom: 4px; display: block; }
              .doc-company { font-size: 14px; font-weight: 700; color: #1e3a5f; margin: 0 0 2px 0; }
              .doc-slogan { font-size: 9px; color: #64748b; margin: 0; }
              .doc-meta { text-align: right; font-size: 9px; color: #64748b; }
              .doc-meta strong { color: #1e3a5f; }
              .doc-title {
                font-size: 16px;
                font-weight: 700;
                color: #1e3a5f;
                text-align: center;
                margin: 12px 0 4px 0;
              }
              .doc-subtitle {
                font-size: 9px;
                color: #64748b;
                text-align: center;
                margin: 0 0 14px 0;
                font-style: italic;
              }
              .grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0 24px;
              }
              .section {
                margin-bottom: 12px;
                break-inside: avoid;
              }
              .section-title {
                font-size: 9px;
                font-weight: 700;
                color: #1e3a5f;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                margin-bottom: 6px;
                padding-bottom: 3px;
              }
              .info-table {
                display: grid;
                grid-template-columns: auto 1fr;
                column-gap: 10px;
                row-gap: 3px;
                font-size: 10px;
              }
              .info-table .label { color: #64748b; }
              .info-table .value { font-weight: 500; color: #1f2937; }
              .data-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }
              .data-table tr:nth-child(even) { background: #f8fafc; }
              .data-table tr:nth-child(odd) { background: #fff; }
              .data-table th {
                text-align: left;
                padding: 6px 8px;
                font-weight: 600;
                color: #1e3a5f;
                background: #1e3a5f;
                color: #fff;
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.02em;
              }
              .data-table td { padding: 5px 8px; color: #1f2937; }
              .data-table .num { text-align: right; }
              .conditions {
                font-size: 9px;
                color: #475569;
                margin: 0;
                padding-left: 14px;
                line-height: 1.4;
              }
              .conditions li { margin-bottom: 2px; }
              .doc-footer {
                margin-top: 14px;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
                font-size: 9px;
                color: #64748b;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 4px;
              }
              .doc-footer strong { color: #1e3a5f; }
            </style>
          </head>
          <body>
            ${company?.logo_url ? `<div class="watermark"><img src="${company.logo_url}" alt="" /></div>` : ""}
            <div class="doc-page">
              <div class="doc-bar"></div>
              <div class="doc-body content">
                <header class="doc-header">
                  <div>
                    ${logoImg}
                    <h1 class="doc-company">${companyName}</h1>
                    <p class="doc-slogan">${slogan}</p>
                  </div>
                  <div class="doc-meta">
                    <div><strong>Data:</strong> ${format(new Date(), "dd/MM/yyyy")}</div>
                    <div><strong>Nº Reserva:</strong> ${reservationNumber}</div>
                  </div>
                </header>

                <h2 class="doc-title">COMPROVATIVO DE RESERVA</h2>
                <p class="doc-subtitle">Documento emitido eletronicamente. Não necessita de assinatura manual.</p>

                <div class="grid-2">
                  <section class="section">
                    <div class="section-title">Informações da Reserva</div>
                    <div class="info-table">
                      <span class="label">Número</span><span class="value">${reservationNumber}</span>
                      <span class="label">Data de Emissão</span><span class="value">${format(new Date(), "dd/MM/yyyy")}</span>
                      <span class="label">Estado</span><span class="value">${statusLabels[reservation.status] || reservation.status}</span>
                    </div>
                  </section>
                  <section class="section">
                    <div class="section-title">Dados do Cliente</div>
                    <div class="info-table">
                      <span class="label">Nome</span><span class="value">${reservation.customers?.name || "N/A"}</span>
                      <span class="label">Documento</span><span class="value">${(reservation.customers as { id_document?: string })?.id_document || "—"}</span>
                      <span class="label">Telefone</span><span class="value">${reservation.customers?.phone || "N/A"}</span>
                      <span class="label">Email</span><span class="value">${(reservation.customers as { email?: string })?.email || "—"}</span>
                    </div>
                  </section>
                </div>

                <div class="grid-2">
                  <section class="section">
                    <div class="section-title">Detalhes da Viatura</div>
                    <div class="info-table">
                      <span class="label">Categoria</span><span class="value">${(reservation.cars as { car_type?: string })?.car_type || "—"}</span>
                      <span class="label">Marca / Modelo</span><span class="value">${reservation.cars ? `${reservation.cars.brand} ${reservation.cars.model}` : "N/A"}</span>
                      <span class="label">Transmissão</span><span class="value">${(reservation.cars as { transmission?: string })?.transmission || "—"}</span>
                      <span class="label">Combustível</span><span class="value">${(reservation.cars as { fuel_type?: string })?.fuel_type || "—"}</span>
                      <span class="label">Matrícula</span><span class="value">${reservation.cars?.license_plate || "N/A"}</span>
                    </div>
                  </section>
                  <section class="section">
                    <div class="section-title">Período de Aluguer</div>
                    <div class="info-table">
                      <span class="label">Levantamento</span><span class="value">${formatAngolaDate(reservation.start_date)} · ${pickupTime} · ${pickupLocation}</span>
                      <span class="label">Devolução</span><span class="value">${formatAngolaDate(reservation.end_date)} · ${returnTime} · ${returnLocation}</span>
                    </div>
                  </section>
                </div>

                <section class="section">
                  <div class="section-title">Valores</div>
                  <table class="data-table">
                    <thead><tr><th>Conceito</th><th class="num">Valor</th></tr></thead>
                    <tbody>
                      <tr><td>Valor Diário</td><td class="num">${dailyRate.toFixed(2)} AKZ</td></tr>
                      <tr><td>Número de Dias</td><td class="num">${numberOfDays}</td></tr>
                      <tr><td>Extras / Observações</td><td class="num">${reservation.notes || "—"}</td></tr>
                      <tr><td><strong>Total Estimado</strong></td><td class="num"><strong>${reservation.total_amount.toFixed(2)} AKZ</strong></td></tr>
                      <tr><td>Forma de Pagamento</td><td class="num">A definir</td></tr>
                    </tbody>
                  </table>
                </section>

                <section class="section">
                  <div class="section-title">Condições Gerais</div>
                  <ul class="conditions">
                    <li>É obrigatória a apresentação de documento de identificação válido e carta de condução válida.</li>
                    <li>A viatura deverá ser devolvida conforme acordado. A reserva está sujeita aos Termos e Condições da ${companyName}.</li>
                  </ul>
                </section>

                <section class="section">
                  <div class="section-title">Validação</div>
                  <div class="info-table" style="max-width: 200px;">
                    <span class="label">Código de Verificação</span><span class="value"><strong>${verificationCode}</strong></span>
                  </div>
                  <div class="qr-wrap">
                    <img src="${qrSrc}" alt="QR Code" class="qr-code" />
                    <span class="qr-code-label">Escaneie para validar o comprovativo</span>
                  </div>
                </section>

                <footer class="doc-footer">
                  <div>
                    <strong>${companyName}</strong>
                    ${company?.phone ? ` · ${company.phone}` : ""}
                    ${company?.email ? ` · ${company.email}` : ""}
                    ${company?.address ? ` · ${company.address}` : ""}
                  </div>
                  <div>Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}</div>
                </footer>
              </div>
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

  useEffect(() => {
    if (reservation && company && searchParams.get("openPdf") === "1") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("openPdf");
        return next;
      });
      exportToPDF();
    }
  }, [reservation, company, searchParams]);

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

