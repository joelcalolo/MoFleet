import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { handleError, logError } from "@/lib/errorHandler";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);

  useEffect(() => {
    // Verificar se está no modo de redefinição de senha
    const mode = searchParams.get("mode");
    if (mode === "reset-password") {
      setIsResetPassword(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }

    // Verificar se há hash de confirmação na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (accessToken && type === "recovery") {
      setIsResetPassword(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiplos submits muito rápidos (debounce de 2 segundos)
    const now = Date.now();
    if (now - lastAttemptTime < 2000) {
      toast.error("Por favor, aguarde um momento antes de tentar novamente.");
      return;
    }
    setLastAttemptTime(now);
    
    if (isResetPassword) {
      if (!newPassword || !confirmPassword) {
        toast.error("Por favor, preencha todos os campos");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;
        
        toast.success("Senha redefinida com sucesso! Você pode fazer login agora.");
        setIsResetPassword(false);
        setIsLogin(true);
        setNewPassword("");
        setConfirmPassword("");
        navigate("/auth");
      } catch (error: any) {
        logError(error, "Auth - Reset Password");
        const errorMessage = handleError(error, "Erro ao redefinir senha");
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isForgotPassword) {
      if (!email) {
        toast.error("Por favor, informe seu email");
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset-password`,
        });

        if (error) throw error;
        
        toast.success("Email de redefinição de senha enviado! Verifique sua caixa de entrada.");
        setIsForgotPassword(false);
      } catch (error: any) {
        logError(error, "Auth - Forgot Password");
        const errorMessage = handleError(error, "Erro ao enviar email de redefinição");
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (!isLogin && !companyName) {
      toast.error("Por favor, informe o nome da empresa");
      return;
    }

    if (!isLogin && !acceptedTerms) {
      toast.error("Você deve aceitar os Termos de Uso e Política de Privacidade para criar uma conta");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success("Login realizado com sucesso");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              company_name: companyName,
            },
          },
        });

        if (error) throw error;
        
        // Redirecionar para página de confirmação
        navigate("/auth/confirm", { state: { email } });
      }
    } catch (error: any) {
      logError(error, "Auth - Signup/Login");
      const errorMessage = handleError(error, "Erro na autenticação");
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
          <CardTitle className="text-2xl">MoFleet</CardTitle>
          <CardDescription>
            {isResetPassword
              ? "Defina sua nova senha"
              : isForgotPassword 
              ? "Redefinir senha" 
              : isLogin 
              ? "Faça login para acessar o sistema" 
              : "Crie sua conta de gestor"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isResetPassword ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => {
                    setIsResetPassword(false);
                    setIsLogin(true);
                    navigate("/auth");
                  }}
                  disabled={loading}
                >
                  Voltar ao login
                </Button>
              </>
            ) : (
              <>
                {!isLogin && !isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Nome da sua empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                )}
                {!isLogin && !isForgotPassword && (
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
                )}
                <Button type="submit" className="w-full" disabled={loading || (!isLogin && !acceptedTerms)}>
                  {loading 
                    ? "Carregando..." 
                    : isForgotPassword 
                    ? "Enviar email de redefinição" 
                    : isLogin 
                    ? "Entrar" 
                    : "Criar Conta"}
                </Button>
                {!isForgotPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setAcceptedTerms(false);
                    }}
                    disabled={loading}
                  >
                    {isLogin ? "Criar nova conta" : "Já tenho uma conta"}
                  </Button>
                )}
                {isLogin && !isForgotPassword && (
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setIsForgotPassword(true)}
                    disabled={loading}
                  >
                    Esqueci minha senha
                  </Button>
                )}
                {isForgotPassword && (
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setIsForgotPassword(false)}
                    disabled={loading}
                  >
                    Voltar ao login
                  </Button>
                )}
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;