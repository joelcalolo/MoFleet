import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Car, Calendar, Users, LayoutDashboard, LogOut, UserCircle, Settings, Truck, FileText, ChevronLeft, ChevronRight, Menu, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCompanyUser } from "@/contexts/CompanyUserContext";
import { getCurrentCompanyUser } from "@/lib/authUtils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const isMobile = useIsMobile();
  const { companyUser, isGerente, logout: logoutCompanyUser } = useCompanyUser();

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      const publicPaths = ["/", "/auth", "/terms", "/privacy"];
      const onPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
      // Usar getCurrentCompanyUser() no momento da decisão para evitar closure obsoleta
      // (em refresh, companyUser do context pode ainda ser null quando o callback roda).
      const currentCompanyUser = getCurrentCompanyUser();
      if (!session && !currentCompanyUser && !onPublicPath) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      const publicPaths = ["/", "/auth", "/terms", "/privacy"];
      const onPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
      const currentCompanyUser = getCurrentCompanyUser();
      if (!session && !currentCompanyUser && !onPublicPath) {
        navigate("/auth");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (user && !companyUser) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsSuperAdmin(profile?.role === 'super_admin');
      } else {
        setIsSuperAdmin(false);
      }
    };
    checkSuperAdmin();
  }, [user, companyUser]);

  const handleLogout = async () => {
    // Se for company_user, apenas fazer logout do company_user
    if (companyUser) {
      logoutCompanyUser();
    } else {
      await supabase.auth.signOut();
    }
    navigate("/auth");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Agenda", path: "/schedule" },
    { icon: Car, label: "Carros", path: "/cars" },
    { icon: Users, label: "Clientes", path: "/customers" },
    { icon: UserCircle, label: "Reservas", path: "/reservations" },
    { icon: Truck, label: "Frota", path: "/fleet" },
    { icon: FileText, label: "Resumo de Alugueres", path: "/rentals-summary" },
  ];

  // Permitir acesso se houver user ou companyUser
  if (!user && !companyUser) return null;

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Botão Menu Mobile */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border p-4 flex items-center justify-between">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="h-full flex flex-col">
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="MoFleet" className="h-8 w-auto" />
                    <h1 className="text-lg font-bold">MoFleet</h1>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto space-y-2 p-4">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={location.pathname === item.path ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        location.pathname === item.path && "bg-secondary"
                      )}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                </nav>
                <div className="p-4 border-t border-border bg-card">
                  <div className="mb-2 text-xs text-muted-foreground truncate">
                    {companyUser ? companyUser.username : user?.email || ""}
                    {companyUser && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {companyUser.role === "gerente" ? "Gerente" : "Técnico"}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant={location.pathname === "/settings" ? "secondary" : "outline"}
                      className={cn(
                        "w-full justify-start",
                        location.pathname === "/settings" && "bg-secondary"
                      )}
                      onClick={() => {
                        navigate("/settings");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </Button>
                    {!companyUser && user && isSuperAdmin && (
                      <Button
                        variant={location.pathname === "/company-users" ? "secondary" : "outline"}
                        className={cn(
                          "w-full justify-start",
                          location.pathname === "/company-users" && "bg-secondary"
                        )}
                        onClick={() => {
                          navigate("/company-users");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Usuários da Empresa
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MoFleet" className="h-8 w-auto" />
            <h1 className="text-lg font-bold">MoFleet</h1>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      {!isMobile && (
        <aside className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300",
          sidebarWidth
        )}>
        <div className="h-full flex flex-col">
          {/* Header do Sidebar */}
          <div className={cn(
            "border-b border-border",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="MoFleet" className="h-8 w-auto" />
                  <h1 className="text-lg font-bold">MoFleet</h1>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={cn(
                  sidebarCollapsed ? "mx-auto" : "ml-auto"
                )}
                title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Menu de Navegação */}
          <nav className={cn(
            "flex-1 overflow-y-auto space-y-2",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                className={cn(
                  "w-full",
                  sidebarCollapsed ? "justify-center px-0" : "justify-start",
                  location.pathname === item.path && "bg-secondary"
                )}
                onClick={() => navigate(item.path)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
                {!sidebarCollapsed && item.label}
              </Button>
            ))}
          </nav>

          {/* Footer do Sidebar */}
          <div className={cn(
            "p-4 border-t border-border bg-card",
            sidebarCollapsed ? "px-2" : ""
          )}>
            {!sidebarCollapsed && (
              <div className="mb-2 text-xs text-muted-foreground truncate">
                {companyUser ? companyUser.username : user?.email || ""}
                {companyUser && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {companyUser.role === "gerente" ? "Gerente" : "Técnico"}
                  </Badge>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Button
                variant={location.pathname === "/settings" ? "secondary" : "outline"}
                className={cn(
                  "w-full",
                  sidebarCollapsed ? "justify-center px-0" : "justify-start",
                  location.pathname === "/settings" && "bg-secondary"
                )}
                onClick={() => navigate("/settings")}
                title={sidebarCollapsed ? "Configurações" : undefined}
              >
                <Settings className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
                {!sidebarCollapsed && "Configurações"}
              </Button>
              {!companyUser && user && isSuperAdmin && (
                <Button
                  variant={location.pathname === "/company-users" ? "secondary" : "outline"}
                  className={cn(
                    "w-full",
                    sidebarCollapsed ? "justify-center px-0" : "justify-start",
                    location.pathname === "/company-users" && "bg-secondary"
                  )}
                  onClick={() => navigate("/company-users")}
                  title={sidebarCollapsed ? "Usuários" : undefined}
                >
                  <UserCog className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
                  {!sidebarCollapsed && "Usuários da Empresa"}
                </Button>
              )}
              <Button
                variant="outline"
                className={cn(
                  "w-full",
                  sidebarCollapsed ? "justify-center px-0" : "justify-start"
                )}
                onClick={handleLogout}
                title={sidebarCollapsed ? "Sair" : undefined}
              >
                <LogOut className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
                {!sidebarCollapsed && "Sair"}
              </Button>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* Conteúdo Principal com margem para o sidebar */}
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isMobile ? "pt-16" : sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;