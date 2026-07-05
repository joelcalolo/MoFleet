import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { handleError, logError } from "@/lib/errorHandler";

const RegisterCompany = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !companyEmail || !ownerEmail || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Você deve aceitar os Termos de Uso e Política de Privacidade");
      return;
    }

    setLoading(true);

    try {
      // Criar usuário no Supabase Auth
      // O trigger handle_new_user vai criar automaticamente:
      // - A empresa com subdomain
      // - O user_profile com role 'owner'
      const { data, error } = await supabase.auth.signUp({
        email: ownerEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            company_name: companyName,
            company_email: companyEmail,
          },
        },
      });

      if (error) throw error;

      toast.success("Empresa registrada com sucesso! Verifique seu email para confirmar a conta.");
      navigate("/auth/confirm", { state: { email: ownerEmail } });
    } catch (error: any) {
      logError(error, "RegisterCompany");
      const errorMessage = handleError(error, "Erro ao registrar empresa");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="MoFleet" className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl">Registrar Nova Empresa</CardTitle>
          <CardDescription>
            Crie uma nova empresa no MoFleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Minha Empresa Ltda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email da Empresa *</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="contato@minhaempresa.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Seu Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="seu@email.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  disabled={loading}
                />
                <Label
                  htmlFor="acceptTerms"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Eu concordo com os{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open("/terms", "_blank");
                    }}
                  >
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open("/privacy", "_blank");
                    }}
                  >
                    Política de Privacidade
                  </a>
                </Label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
              {loading ? "Registrando..." : "Registrar Empresa"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={() => navigate("/auth")}
              disabled={loading}
            >
              Voltar ao login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterCompany;
