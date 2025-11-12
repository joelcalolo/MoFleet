import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Settings as SettingsIcon } from "lucide-react";
import { handleError, logError } from "@/lib/errorHandler";

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  logo_url?: string;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      // Buscar o perfil do usuário para obter o company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast.error("Perfil de usuário não encontrado");
        return;
      }

      // Buscar dados da empresa
      const { data: companyData, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (error) throw error;

      setCompany(companyData);
      setFormData({
        name: companyData.name || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        address: companyData.address || "",
        tax_id: companyData.tax_id || "",
      });
    } catch (error: any) {
      logError(error, "Settings - Fetch Company");
      const errorMessage = handleError(error, "Erro ao carregar dados da empresa");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          tax_id: formData.tax_id || null,
        })
        .eq("id", company.id);

      if (error) throw error;

      toast.success("Dados da empresa atualizados com sucesso");
      fetchCompany();
    } catch (error: any) {
      logError(error, "Settings - Update Company");
      const errorMessage = handleError(error, "Erro ao atualizar dados da empresa");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error("Email não encontrado");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) throw error;

      toast.success("Email de redefinição de senha enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      logError(error, "Settings - Reset Password");
      const errorMessage = handleError(error, "Erro ao enviar email de redefinição");
      toast.error(errorMessage);
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

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Configurações</h1>
          </div>
          <p className="text-muted-foreground">Gerencie as informações da sua empresa</p>
        </div>

        <div className="space-y-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Atualize as informações da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id">NIF/Número de Identificação Fiscal</Label>
                    <Input
                      id="tax_id"
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie sua senha e segurança da conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Redefinir Senha</h3>
                    <p className="text-sm text-muted-foreground">
                      Receba um email para redefinir sua senha
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleResetPassword}>
                    Redefinir Senha
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

