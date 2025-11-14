import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const Welcome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState<{
    subdomain: string;
    username: string;
    password: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Buscar credenciais temporárias
        const { data: credentialsData } = await supabase
          .from("company_setup_credentials")
          .select("subdomain, admin_username, admin_password, shown")
          .eq("user_id", user.id)
          .single();

        if (credentialsData && !credentialsData.shown) {
          setCredentials({
            subdomain: credentialsData.subdomain,
            username: credentialsData.admin_username,
            password: credentialsData.admin_password,
          });

          // Marcar como já visualizado
          await supabase
            .from("company_setup_credentials")
            .update({ shown: true })
            .eq("user_id", user.id);
        } else {
          // Se não tem credenciais ou já foram mostradas, redirecionar para dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching credentials:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [navigate]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const handleContinue = () => {
    if (credentials) {
      const subdomainUrl = `https://${credentials.subdomain}.mofleet.com`;
      window.location.href = subdomainUrl;
    } else {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!credentials) {
    return null;
  }

  const subdomainUrl = `https://${credentials.subdomain}.mofleet.com`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">🎉 Conta Criada com Sucesso!</CardTitle>
          <CardDescription className="text-base">
            Sua empresa foi configurada e está pronta para uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-lg">📍 Seu Subdomain</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background px-4 py-2 rounded border text-lg font-mono">
                  {subdomainUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(subdomainUrl, "url")}
                >
                  {copied === "url" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Acesse este endereço para fazer login na sua conta da empresa
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 text-lg">🔑 Credenciais do Administrador</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-background px-4 py-2 rounded border text-lg font-mono">
                      {credentials.username}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(credentials.username, "username")}
                    >
                      {copied === "username" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Senha</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-background px-4 py-2 rounded border text-lg font-mono">
                      {credentials.password}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(credentials.password, "password")}
                    >
                      {copied === "password" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ Guarde esta senha com segurança! Ela não será exibida novamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📝 Próximos Passos:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse seu subdomain: <strong>{subdomainUrl}</strong></li>
              <li>Faça login com as credenciais acima</li>
              <li>Altere a senha do administrador (recomendado)</li>
              <li>Crie outros usuários conforme necessário</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleContinue}
              className="flex-1"
              size="lg"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Acessar Minha Conta
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              size="lg"
            >
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;

