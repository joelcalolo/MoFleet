import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

const EmailConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"checking" | "confirmed" | "error">("checking");

  useEffect(() => {
    // Verificar se há email no state
    const stateEmail = (location.state as any)?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }

    // Verificar se o usuário já está confirmado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email_confirmed_at) {
        setStatus("confirmed");
      } else {
        setStatus("error");
      }
    });

    // Verificar se há token de confirmação na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (accessToken && type === "signup") {
      // O usuário clicou no link de confirmação
      setStatus("confirmed");
    }
  }, [location]);

  const handleResendEmail = async () => {
    if (!email) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) throw error;
      
      alert("Email de confirmação reenviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      alert(error.message || "Erro ao reenviar email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "confirmed" ? (
              <div className="bg-green-500 text-white p-3 rounded-full">
                <CheckCircle className="h-8 w-8" />
              </div>
            ) : (
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <Mail className="h-8 w-8" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "confirmed" ? "Email Confirmado!" : "Confirme seu Email"}
          </CardTitle>
          <CardDescription>
            {status === "confirmed" 
              ? "Sua conta foi confirmada com sucesso!" 
              : "Enviamos um email de confirmação para você"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "confirmed" ? (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Você pode fazer login agora e começar a usar o sistema.
              </p>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Ir para Login
              </Button>
            </>
          ) : (
            <>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1 text-sm space-y-2">
                    <p>
                      <strong>Instruções:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Verifique sua caixa de entrada</li>
                      <li>Procure por um email do sistema</li>
                      <li>Clique no link de confirmação</li>
                      <li>Volte aqui após confirmar</li>
                    </ol>
                  </div>
                </div>
              </div>
              {email && (
                <p className="text-sm text-center text-muted-foreground">
                  Email enviado para: <strong>{email}</strong>
                </p>
              )}
              <div className="space-y-2">
                <Button className="w-full" onClick={handleResendEmail}>
                  Reenviar Email de Confirmação
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  Voltar ao Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirm;

