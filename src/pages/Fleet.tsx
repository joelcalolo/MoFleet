import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car, LogOut, LogIn } from "lucide-react";
import Layout from "@/components/Layout";
import { CheckoutForm } from "@/components/fleet/CheckoutForm";
import { CheckinForm } from "@/components/fleet/CheckinForm";
import { Reservation } from "@/pages/Reservations";
import { formatAngolaDate } from "@/lib/dateUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Checkout {
  id: string;
  reservation_id: string;
  checkout_date: string;
  initial_km: number;
  delivered_by: string;
  notes?: string;
}

interface Checkin {
  id: string;
  reservation_id: string;
  checkin_date: string;
  final_km: number;
  received_by: string;
  deposit_returned: boolean;
  deposit_returned_amount: number;
  fines_amount: number;
  extra_fees_amount: number;
  notes?: string;
}

interface CarOut {
  reservation: Reservation;
  checkout: Checkout;
}

const Fleet = () => {
  const [carsOut, setCarsOut] = useState<CarOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [availableReservations, setAvailableReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    fetchCarsOut();
    fetchAvailableReservations();
  }, []);

  const fetchCarsOut = async () => {
    try {
      // Buscar checkouts sem checkin correspondente
      const { data: checkouts, error: checkoutError } = await supabase
        .from("checkouts")
        .select(`
          *,
          reservations!inner (
            id,
            car_id,
            customer_id,
            start_date,
            end_date,
            location_type,
            with_driver,
            total_amount,
            status,
            deposit_paid,
            notes,
            created_by,
            cars (brand, model, license_plate),
            customers (name, phone)
          )
        `)
        .order("checkout_date", { ascending: false });

      if (checkoutError) throw checkoutError;

      // Filtrar checkouts que não têm checkin
      const checkoutsWithReservations = (checkouts || []) as Array<Checkout & { reservations: Reservation }>;
      
      const carsOutData: CarOut[] = [];
      
      for (const checkout of checkoutsWithReservations) {
        const reservation = checkout.reservations;
        
        if (!reservation) continue;

        // Verificar se existe checkin para esta reserva
        const { data: checkin } = await supabase
          .from("checkins")
          .select("id")
          .eq("reservation_id", reservation.id)
          .maybeSingle();

        if (!checkin) {
          carsOutData.push({
            reservation: reservation,
            checkout: {
              id: checkout.id,
              reservation_id: checkout.reservation_id,
              checkout_date: checkout.checkout_date,
              initial_km: checkout.initial_km,
              delivered_by: checkout.delivered_by,
              notes: checkout.notes || undefined,
            },
          });
        }
      }

      setCarsOut(carsOutData);
    } catch (error) {
      console.error("Error fetching cars out:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableReservations = async () => {
    try {
      // Buscar reservas confirmadas que ainda não têm checkout
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select(`
          *,
          cars (brand, model, license_plate),
          customers (name, phone)
        `)
        .in("status", ["confirmed", "pending"])
        .order("start_date", { ascending: true });

      if (error) throw error;

      // Filtrar reservas que não têm checkout
      const reservationsWithoutCheckout: Reservation[] = [];
      
      for (const reservation of (reservations || []) as Reservation[]) {
        const { data: checkout } = await supabase
          .from("checkouts")
          .select("id")
          .eq("reservation_id", reservation.id)
          .single();

        if (!checkout) {
          reservationsWithoutCheckout.push(reservation);
        }
      }

      setAvailableReservations(reservationsWithoutCheckout);
    } catch (error) {
      console.error("Error fetching available reservations:", error);
    }
  };

  const handleCheckout = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowCheckoutDialog(true);
  };

  const handleCheckin = (carOut: CarOut) => {
    setSelectedReservation(carOut.reservation);
    setSelectedCheckout(carOut.checkout);
    setShowCheckinDialog(true);
  };

  const handleClose = () => {
    setShowCheckoutDialog(false);
    setShowCheckinDialog(false);
    setSelectedReservation(null);
    setSelectedCheckout(null);
  };

  const handleSuccess = () => {
    fetchCarsOut();
    fetchAvailableReservations();
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
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Frota</h1>
            <p className="text-muted-foreground">Gerencie saídas e retornos de carros</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Carros Fora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Carros Fora ({carsOut.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carsOut.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum carro fora no momento
                </div>
              ) : (
                <div className="rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carro</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data de Saída</TableHead>
                        <TableHead>Quilometragem</TableHead>
                        <TableHead>Entregado Por</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {carsOut.map((carOut) => (
                        <TableRow key={carOut.checkout.id}>
                          <TableCell className="font-medium">
                            {carOut.reservation.cars
                              ? `${carOut.reservation.cars.brand} ${carOut.reservation.cars.model}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {carOut.reservation.customers?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {carOut.checkout.checkout_date 
                              ? formatAngolaDate(carOut.checkout.checkout_date)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {carOut.checkout.initial_km.toLocaleString()} km
                          </TableCell>
                          <TableCell>
                            {carOut.checkout.delivered_by}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckin(carOut)}
                            >
                              <LogIn className="mr-2 h-4 w-4" />
                              Registrar Retorno
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reservas Disponíveis para Checkout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Reservas Disponíveis para Saída ({availableReservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableReservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma reserva disponível para checkout
                </div>
              ) : (
                <div className="rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carro</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableReservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">
                            {reservation.cars
                              ? `${reservation.cars.brand} ${reservation.cars.model}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {reservation.customers?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatAngolaDate(reservation.start_date)} -{" "}
                            {formatAngolaDate(reservation.end_date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckout(reservation)}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              Registrar Saída
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog para Checkout */}
        <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Saída do Carro</DialogTitle>
            </DialogHeader>
            {selectedReservation && (
              <CheckoutForm
                reservation={selectedReservation}
                onClose={handleClose}
                onSuccess={handleSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para Checkin */}
        <Dialog open={showCheckinDialog} onOpenChange={setShowCheckinDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Retorno do Carro</DialogTitle>
            </DialogHeader>
            {selectedReservation && selectedCheckout && (
              <CheckinForm
                reservation={selectedReservation}
                checkout={selectedCheckout}
                onClose={handleClose}
                onSuccess={handleSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Fleet;

