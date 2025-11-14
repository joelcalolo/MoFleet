import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Car } from "@/pages/Cars";
import { useCompany } from "@/hooks/useCompany";
import { handleError, logError } from "@/lib/errorHandler";

interface CarFormProps {
  car: Car | null;
  onClose: () => void;
}

export const CarForm = ({ car, onClose }: CarFormProps) => {
  const [loading, setLoading] = useState(false);
  const { companyId } = useCompany();
  const [formData, setFormData] = useState({
    brand: car?.brand || "",
    model: car?.model || "",
    license_plate: car?.license_plate || "",
    car_type: car?.car_type || "",
    transmission: car?.transmission || "manual",
    drive_type: car?.drive_type || "fwd",
    seats: car?.seats || 5,
    fuel_type: car?.fuel_type || "gasolina",
    price_city_with_driver: car?.price_city_with_driver || 0,
    price_city_without_driver: car?.price_city_without_driver || 0,
    price_outside_with_driver: car?.price_outside_with_driver || 0,
    price_outside_without_driver: car?.price_outside_without_driver || 0,
    delivery_fee: car?.delivery_fee || 0,
    pickup_fee: car?.pickup_fee || 0,
    deposit_amount: car?.deposit_amount || 0,
    daily_km_limit: car?.daily_km_limit || 200,
    extra_km_price: car?.extra_km_price || 0,
    notes: car?.notes || "",
    is_available: car?.is_available ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (car) {
        const { error } = await supabase
          .from("cars")
          .update(formData)
          .eq("id", car.id);

        if (error) throw error;
        toast.success("Carro atualizado com sucesso");
      } else {
        if (!companyId) {
          toast.error("Erro: Empresa não encontrada");
          return;
        }

        const { error } = await supabase.from("cars").insert([{ ...formData, company_id: companyId }]);

        if (error) throw error;
        toast.success("Carro cadastrado com sucesso");
      }

      onClose();
    } catch (error: any) {
      logError(error, "CarForm");
      const errorMessage = handleError(error, "Erro ao salvar carro");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Marca *</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modelo *</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_plate">Matrícula *</Label>
          <Input
            id="license_plate"
            value={formData.license_plate}
            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="car_type">Tipo *</Label>
          <Input
            id="car_type"
            placeholder="Ex: SUV, Sedan, Hatchback"
            value={formData.car_type}
            onChange={(e) => setFormData({ ...formData, car_type: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transmission">Caixa *</Label>
          <Select
            value={formData.transmission}
            onValueChange={(value) => setFormData({ ...formData, transmission: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatica">Automática</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="drive_type">Tração *</Label>
          <Select
            value={formData.drive_type}
            onValueChange={(value) => setFormData({ ...formData, drive_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fwd">Dianteira</SelectItem>
              <SelectItem value="rwd">Traseira</SelectItem>
              <SelectItem value="awd">4x4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seats">Lugares *</Label>
          <Input
            id="seats"
            type="number"
            min="2"
            max="9"
            value={formData.seats}
            onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fuel_type">Combustível *</Label>
          <Select
            value={formData.fuel_type}
            onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gasolina">Gasolina</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="eletrico">Elétrico</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Preços (AKZ/dia)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_city_with_driver">Cidade com motorista *</Label>
            <Input
              id="price_city_with_driver"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_city_with_driver}
              onChange={(e) => setFormData({ ...formData, price_city_with_driver: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_city_without_driver">Cidade sem motorista *</Label>
            <Input
              id="price_city_without_driver"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_city_without_driver}
              onChange={(e) => setFormData({ ...formData, price_city_without_driver: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_outside_with_driver">Fora da cidade com motorista *</Label>
            <Input
              id="price_outside_with_driver"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_outside_with_driver}
              onChange={(e) => setFormData({ ...formData, price_outside_with_driver: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_outside_without_driver">Fora da cidade sem motorista *</Label>
            <Input
              id="price_outside_without_driver"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_outside_without_driver}
              onChange={(e) => setFormData({ ...formData, price_outside_without_driver: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Taxas e Caução (AKZ)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="delivery_fee">Taxa de entrega</Label>
            <Input
              id="delivery_fee"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_fee}
              onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup_fee">Taxa de recolha</Label>
            <Input
              id="pickup_fee"
              type="number"
              step="0.01"
              min="0"
              value={formData.pickup_fee}
              onChange={(e) => setFormData({ ...formData, pickup_fee: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit_amount">Caução *</Label>
            <Input
              id="deposit_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.deposit_amount}
              onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Controle de Quilometragem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="daily_km_limit">Plafond Diário de KM *</Label>
            <Input
              id="daily_km_limit"
              type="number"
              min="0"
              value={formData.daily_km_limit}
              onChange={(e) => setFormData({ ...formData, daily_km_limit: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Quilometragem máxima permitida por dia de aluguel
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra_km_price">Preço por KM Extra (AKZ) *</Label>
            <Input
              id="extra_km_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.extra_km_price}
              onChange={(e) => setFormData({ ...formData, extra_km_price: parseFloat(e.target.value) || 0 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Valor cobrado por cada km que exceder o plafond diário
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between space-x-2 border-t pt-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_available">Disponível para aluguer</Label>
          <p className="text-sm text-muted-foreground">
            Marque se o carro está disponível para ser alugado
          </p>
        </div>
        <Switch
          id="is_available"
          checked={formData.is_available}
          onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : car ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
};