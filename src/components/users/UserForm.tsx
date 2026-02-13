import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserProfile } from "@/pages/Users";
import { handleError, logError } from "@/lib/errorHandler";

interface UserFormProps {
  user: UserProfile | null;
  onClose: () => void;
}

export const UserForm = ({ user, onClose }: UserFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    position: "",
    role: "user" as "owner" | "admin" | "user",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email ?? user.auth_users?.email ?? "",
        password: "",
        position: user.position ?? "",
        role: user.role as "owner" | "admin" | "user",
        is_active: user.is_active,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        position: "",
        role: "user",
        is_active: true,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            name: formData.name || null,
            role: formData.role,
            is_active: formData.is_active,
          })
          .eq("id", user.id);

        if (error) throw error;
        toast.success("Funcionário atualizado com sucesso");
      } else {
        if (!formData.email || !formData.password) {
          toast.error("Email e senha são obrigatórios para criar novo funcionário");
          setLoading(false);
          return;
        }

        const { data: fnData, error: fnError } = await supabase.functions.invoke("create-user", {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name || null,
            role: formData.role,
            is_active: formData.is_active,
          },
        });

        if (fnError) throw fnError;
        if (fnData?.error) {
          toast.error(fnData.error);
          setLoading(false);
          return;
        }
        toast.success("Funcionário criado com sucesso");
      }

      onClose();
    } catch (error: any) {
      logError(error, "UserForm");
      const errorMessage = handleError(error, "Erro ao salvar funcionário");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome completo do funcionário"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Cargo / Posição</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Ex: Motorista, Gerente"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required={!user}
            disabled={!!user}
            placeholder="email@exemplo.com"
          />
        </div>
        {!user && (
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Senha inicial"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="role">Função *</Label>
          <Select
            value={formData.role}
            onValueChange={(value: "owner" | "admin" | "user") => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="owner">Proprietário</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: checked as boolean })
          }
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Funcionário Ativo
        </Label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : user ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};
