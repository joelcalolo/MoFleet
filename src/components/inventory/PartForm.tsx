import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Category } from "./CategoryForm";

export interface Part {
  id: string;
  code: string;
  name: string;
  description?: string;
  category_id: string;
  car_model_reference?: string;
  unit: string;
  min_stock: number;
  warehouse_location?: string;
  average_price: number;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PartFormProps {
  part: Part | null;
  onClose: () => void;
}

interface Car {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
}

export const PartForm = ({ part, onClose }: PartFormProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [formData, setFormData] = useState({
    code: part?.code || "",
    name: part?.name || "",
    description: part?.description || "",
    category_id: part?.category_id || "",
    car_model_reference: part?.car_model_reference || "",
    unit: part?.unit || "un",
    min_stock: part?.min_stock || 0,
    warehouse_location: part?.warehouse_location || "",
    notes: part?.notes || "",
    is_active: part?.is_active ?? true,
  });

  useEffect(() => {
    fetchCategories();
    fetchCars();
    
    // Se estiver editando e já tem car_model_reference, tentar encontrar o carro correspondente
    if (part?.car_model_reference) {
      const matchingCar = cars.find(car => 
        `${car.brand} ${car.model}` === part.car_model_reference ||
        car.model === part.car_model_reference
      );
      if (matchingCar) {
        setSelectedCarId(matchingCar.id);
      }
    }
  }, []);

  useEffect(() => {
    // Atualizar selectedCarId quando cars carregarem e part existir
    if (part?.car_model_reference && cars.length > 0) {
      const matchingCar = cars.find(car => 
        `${car.brand} ${car.model}` === part.car_model_reference ||
        car.model === part.car_model_reference
      );
      if (matchingCar) {
        setSelectedCarId(matchingCar.id);
      }
    }
  }, [cars, part]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("part_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("id, brand, model, license_plate")
        .order("brand")
        .order("model");

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  const handleCarSelect = (carId: string) => {
    if (carId === "none") {
      setSelectedCarId("");
      setFormData({ ...formData, car_model_reference: "" });
      return;
    }
    
    setSelectedCarId(carId);
    const selectedCar = cars.find(c => c.id === carId);
    if (selectedCar) {
      // Formato: "Marca Modelo" (ex: "Toyota Prado TXL")
      setFormData({ ...formData, car_model_reference: `${selectedCar.brand} ${selectedCar.model}` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (part) {
        const { error } = await supabase
          .from("parts")
          .update(formData)
          .eq("id", part.id);

        if (error) throw error;
        toast.success("Peça atualizada com sucesso");
      } else {
        // Se código está vazio, deixar NULL para trigger gerar automaticamente
        const insertData = {
          ...formData,
          code: formData.code.trim() === "" ? null : formData.code.toUpperCase(),
        };
        
        const { error } = await supabase
          .from("parts")
          .insert([insertData])
          .select();

        if (error) throw error;
        toast.success("Peça cadastrada com sucesso");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar peça");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Será gerado automaticamente (CAT-MODELO-001)"
            disabled={!part || !formData.category_id} // Permitir editar apenas se estiver editando e tiver categoria
          />
          <p className="text-xs text-muted-foreground">
            {part ? "Pode editar o código manualmente" : "Código será gerado automaticamente: Categoria-Modelo-001"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Categoria *</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({category.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unidade de Medida *</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="un">Unidade (un)</SelectItem>
              <SelectItem value="L">Litro (L)</SelectItem>
              <SelectItem value="kg">Quilograma (kg)</SelectItem>
              <SelectItem value="conj">Conjunto (conj)</SelectItem>
              <SelectItem value="rolo">Rolo</SelectItem>
              <SelectItem value="jogo">Jogo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="car_model_reference">Modelo de Carro</Label>
          <div className="space-y-2">
            <Select
              value={selectedCarId || "none"}
              onValueChange={handleCarSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um carro da frota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (Genérico)</SelectItem>
                {cars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.brand} {car.model} - {car.license_plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="car_model_reference"
              value={formData.car_model_reference}
              onChange={(e) => {
                setFormData({ ...formData, car_model_reference: e.target.value });
                // Limpar seleção se usuário digitar manualmente
                if (e.target.value !== formData.car_model_reference) {
                  setSelectedCarId("");
                }
              }}
              placeholder="Ou digite manualmente (ex: Prado TXL)"
            />
            <p className="text-xs text-muted-foreground">
              Selecione um carro da lista ou digite manualmente. O código será gerado automaticamente.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_stock">Stock Mínimo</Label>
          <Input
            id="min_stock"
            type="number"
            step="0.01"
            min="0"
            value={formData.min_stock}
            onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warehouse_location">Localização no Armazém</Label>
          <Input
            id="warehouse_location"
            value={formData.warehouse_location}
            onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
            placeholder="Prateleira A1, Sector B"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Ativo</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : part ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
};
