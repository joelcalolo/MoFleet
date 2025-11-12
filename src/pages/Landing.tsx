import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Calendar, Users, BarChart3, Shield, Zap, CheckCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: "Gestão de Reservas",
      description: "Controle completo de reservas com calendário visual e alertas automáticos",
    },
    {
      icon: Car,
      title: "Gestão de Frota",
      description: "Acompanhe saídas e retornos de veículos em tempo real",
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastro completo de clientes com histórico de alugueres",
    },
    {
      icon: BarChart3,
      title: "Relatórios e Análises",
      description: "Gere relatórios detalhados e acompanhe métricas importantes",
    },
    {
      icon: Shield,
      title: "Multi-Empresas",
      description: "Sistema preparado para múltiplas empresas com isolamento de dados",
    },
    {
      icon: Zap,
      title: "Notificações",
      description: "Alertas automáticos para reservas próximas e retornos programados",
    },
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MoFleet" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-primary">
              MoFleet
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium">
              Entrar
            </Button>
            <Button 
              variant="hero"
              onClick={() => navigate("/auth")}
              className="font-medium"
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-28 text-center">
        <div className={`max-w-4xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Sistema de{" "}
            <span className="text-primary">Gestão de Alugueres</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Gerencie sua frota de veículos, reservas e clientes de forma organizada e eficiente. 
            Uma solução completa para empresas de aluguer de veículos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="hero"
              onClick={() => navigate("/auth")}
              className="font-semibold px-8 py-3 hover:scale-105"
            >
              Criar Conta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="font-semibold px-8 py-3 border-2 hover:scale-105 transition-all duration-300"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold mb-4 text-foreground">
            Funcionalidades Principais
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas essenciais para gerenciar sua operação de aluguer de veículos
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/20 hover:scale-105 cursor-pointer bg-card"
            >
              <CardContent className="p-8">
                <div className="p-3 rounded-xl bg-gradient-hero/10 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Saiba mais <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-r from-primary/5 to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Como Funciona</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Um sistema simples e direto para gerenciar seus alugueres
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-3">1. Crie Reservas</h4>
                <p className="text-muted-foreground">
                  Registre reservas de veículos com todas as informações necessárias: cliente, veículo, datas e valores.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-3">2. Gerencie a Frota</h4>
                <p className="text-muted-foreground">
                  Controle saídas e retornos de veículos, registre quilometragem e estado dos veículos.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-3">3. Acompanhe Resultados</h4>
                <p className="text-muted-foreground">
                  Visualize relatórios e histórico completo de alugueres para tomar decisões informadas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="gradient-hero rounded-3xl p-12 text-white">
          <h3 className="text-4xl font-bold text-center mb-12">Por que escolher o MoFleet?</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4 group hover:scale-105 transition-transform duration-300">
              <CheckCircle className="h-7 w-7 text-accent flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h4 className="font-bold text-lg mb-2">Fácil de Usar</h4>
                <p className="text-white/90">
                  Interface intuitiva e moderna, projetada para facilitar o dia a dia da sua equipe
                </p>
              </div>
            </div>
            <div className="flex gap-4 group hover:scale-105 transition-transform duration-300">
              <CheckCircle className="h-7 w-7 text-accent flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h4 className="font-bold text-lg mb-2">Seguro e Confiável</h4>
                <p className="text-white/90">
                  Seus dados protegidos com criptografia avançada e backup automático
                </p>
              </div>
            </div>
            <div className="flex gap-4 group hover:scale-105 transition-transform duration-300">
              <CheckCircle className="h-7 w-7 text-accent flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h4 className="font-bold text-lg mb-2">Acessível de Qualquer Lugar</h4>
                <p className="text-white/90">
                  Acesse o sistema de qualquer dispositivo, a qualquer hora, com sincronização em tempo real
                </p>
              </div>
            </div>
            <div className="flex gap-4 group hover:scale-105 transition-transform duration-300">
              <CheckCircle className="h-7 w-7 text-accent flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h4 className="font-bold text-lg mb-2">Sistema Completo</h4>
                <p className="text-white/90">
                  Todas as funcionalidades necessárias para gerenciar sua operação de aluguer de veículos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-4xl font-bold mb-6">
            Comece a Gerenciar sua Frota Hoje
          </h3>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Crie sua conta e comece a organizar suas reservas, veículos e clientes de forma profissional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="hero"
              onClick={() => navigate("/auth")}
              className="font-semibold px-8 py-4 text-lg hover:scale-105"
            >
              Criar Conta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="font-semibold px-8 py-4 text-lg border-2 hover:scale-105 transition-all duration-300"
            >
              Fazer Login
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Sistema desenvolvido pela Expresso Kiuvo
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="MoFleet" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-primary">
                  MoFleet
                </h1>
                <p className="text-sm text-muted-foreground">
                  Soluções inteligentes para gestão de frotas
                </p>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm text-center md:text-right">
              &copy; 2025 MoFleet - Expresso Kiuvo. Todos os direitos reservados.
            </p>
            
            <div className="flex gap-6 text-sm">
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/terms");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
              >
                Termos de Uso
              </a>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/privacy");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
              >
                Política de Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;