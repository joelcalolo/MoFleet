import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleReservation {
  id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  status: string;
  cars: { brand: string; model: string; license_plate: string };
  customers: { name: string };
}

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<ScheduleReservation[]>([]);
  const [cars, setCars] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(addMonths(currentDate, 1));

    const [reservationsRes, carsRes] = await Promise.all([
      supabase
        .from("reservations")
        .select("*, cars(brand, model, license_plate), customers(name)")
        .gte("end_date", format(start, "yyyy-MM-dd"))
        .lte("start_date", format(end, "yyyy-MM-dd"))
        .neq("status", "cancelled"),
      supabase.from("cars").select("*").order("brand"),
    ]);

    setReservations(reservationsRes.data || []);
    setCars(carsRes.data || []);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const statusColors: Record<string, string> = {
    pending: "bg-status-pending/20 border-status-pending",
    confirmed: "bg-status-confirmed/20 border-status-confirmed",
    active: "bg-status-active/20 border-status-active",
    completed: "bg-status-completed/20 border-status-completed",
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Agenda de Reservas</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[200px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[200px_1fr] gap-4">
              <div className="font-semibold">Veículo</div>
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
            </div>

            {cars.map((car) => {
              const carReservations = reservations.filter((r) => r.car_id === car.id);

              return (
                <div key={car.id} className="grid grid-cols-[200px_1fr] gap-4 mt-4 border-t pt-4">
                  <div className="text-sm font-medium">
                    {car.brand} {car.model}
                    <div className="text-xs text-muted-foreground">{car.license_plate}</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day) => {
                      const reservation = carReservations.find((r) => {
                        const start = new Date(r.start_date);
                        const end = new Date(r.end_date);
                        return day >= start && day <= end;
                      });

                      return (
                        <div
                          key={day.toISOString()}
                          className={`h-12 rounded border flex items-center justify-center text-xs ${
                            reservation
                              ? statusColors[reservation.status] || "bg-muted"
                              : "bg-card border-border"
                          }`}
                          title={reservation?.customers?.name}
                        >
                          {format(day, "d")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Schedule;