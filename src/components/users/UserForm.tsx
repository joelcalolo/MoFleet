import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { User, UserProfile, CompanyUser } from "@/pages/Users";
import { handleError, logError } from "@/lib/errorHandler";

interface UserFormProps {
  user: User | null;
  onClose: () => void;
}

export const UserForm = ({ user, onClose }: UserFormProps) => {
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<"profile" | "company">("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    role: "user" as "owner" | "admin" | "user" | "gerente" | "tecnico",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      // Determinar tipo de usuário
      if ("user_id" in user) {
        // É UserProfile
        setUserType("profile");
        const profile = user as UserProfile;
        setFormData({
          name: profile.name || "",
          email: profile.auth_users?.email || "",
          password: "", // Não mostrar senha existente
          username: "",
          role: profile.role as any,
          is_active: profile.is_active,
        });
      } else {
        // É CompanyUser
        setUserType("company");
        const companyUser = user as CompanyUser;
        setFormData({
          name: "",
          email: "",
          password: "",
          username: companyUser.username,
          role: companyUser.role,
          is_active: companyUser.is_active,
        });
      }
    } else {
      // Novo usuário - resetar
      setUserType("profile");
      setFormData({
        name: "",
        email: "",
        password: "",
        username: "",
        role: "user",
        is_active: true,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userType === "profile") {
        // Criar ou atualizar user_profile
        if (user && "user_id" in user) {
          // Atualizar perfil existente
          const profile = user as UserProfile;
          const { error } = await supabase
            .from("user_profiles")
            .update({
              name: formData.name || null,
              role: formData.role,
              is_active: formData.is_active,
            })
            .eq("id", profile.id);

          if (error) throw error;
          toast.success("Funcionário atualizado com sucesso");
        } else {
          // Criar novo usuário com email
          if (!formData.email || !formData.password) {
            toast.error("Email e senha são obrigatórios para criar novo funcionário");
            setLoading(false);
            return;
          }

          // Criar usuário no auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true,
          });

          if (authError) throw authError;

          // Buscar company_id do usuário atual
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) throw new Error("Usuário não autenticado");

          const { data: currentProfile } = await supabase
            .from("user_profiles")
            .select("company_id")
            .eq("user_id", currentUser.id)
            .single();

          if (!currentProfile) throw new Error("Perfil não encontrado");

          // Criar user_profile
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              user_id: authData.user.id,
              company_id: currentProfile.company_id,
              name: formData.name || null,
              role: formData.role,
              is_active: formData.is_active,
            });

          if (profileError) throw profileError;
          toast.success("Funcionário criado com sucesso");
        }
      } else {
        // Criar ou atualizar company_user
        if (user && "username" in user && !("user_id" in user)) {
          // Atualizar company_user existente
          const companyUser = user as CompanyUser;
          const { error } = await supabase
            .from("company_users")
            .update({
              username: formData.username,
              role: formData.role,
              is_active: formData.is_active,
            })
            .eq("id", companyUser.id);

          if (error) throw error;
          toast.success("Funcionário atualizado com sucesso");
        } else {
          // Criar novo company_user
          if (!formData.username || !formData.password) {
            toast.error("Username e senha são obrigatórios");
            setLoading(false);
            return;
          }

          // Buscar company_id do usuário atual
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) throw new Error("Usuário não autenticado");

          const { data: currentProfile } = await supabase
            .from("user_profiles")
            .select("company_id")
            .eq("user_id", currentUser.id)
            .single();

          if (!currentProfile) throw new Error("Perfil não encontrado");

          // Criar company_user usando função RPC admin_create_company_user
          const { data: newUserId, error: createError } = await supabase.rpc("admin_create_company_user", {
            p_username: formData.username,
            p_password: formData.password,
            p_role: formData.role,
            p_company_id: currentProfile.company_id,
          });

          if (createError) {
            throw createError;
          }

          toast.success("Funcionário criado com sucesso");
        }
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
      {!user && (
        <div className="space-y-2">
          <Label>Tipo de Funcionário *</Label>
          <Select value={userType} onValueChange={(value: "profile" | "company") => setUserType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">Com Email (Conta Completa)</SelectItem>
              <SelectItem value="company">Interno (Apenas Username)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {userType === "profile" ? (
        <>
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
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="nome_usuario"
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
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

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
