import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Car, Calendar, Users, LayoutDashboard, LogOut, UserCircle, Settings, Truck, FileText, ChevronLeft, ChevronRight, Menu, Package, Warehouse, ShoppingCart, ArrowDownCircle, ArrowUpCircle, ClipboardCheck, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stockMenuOpen, setStockMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      const publicPaths = ["/", "/auth", "/terms", "/privacy"];
      const onPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
      if (!session && !onPublicPath) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      const publicPaths = ["/", "/auth", "/terms", "/privacy"];
      const onPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
      if (!session && !onPublicPath) {
        navigate("/auth");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const checkSuperAdmin = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) {
          setIsSuperAdmin(profile?.role === 'super_admin');
          setUserRole(profile?.role || null);
        }
      } else {
        if (!cancelled) {
          setIsSuperAdmin(false);
          setUserRole(null);
        }
      }
    };

    checkSuperAdmin();

    return () => {
      cancelled = true;
    };
  }, [user?.id]); // Depender apenas de user?.id em vez de user inteiro

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Menu principal - Reservas em destaque
  const mainMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: UserCircle, label: "Reservas", path: "/reservations", highlight: true },
    { icon: Calendar, label: "Agenda", path: "/schedule" },
    { icon: Car, label: "Carros", path: "/cars" },
    { icon: Users, label: "Clientes", path: "/customers" },
    { icon: Truck, label: "Frota", path: "/fleet" },
    { icon: FileText, label: "Resumo de Alugueres", path: "/rentals-summary" },
    { icon: Package, label: "Stock", path: "/inventory" },
    // Mostrar Funcionários apenas para admins/owners
    ...(userRole === 'admin' || userRole === 'owner' || isSuperAdmin 
      ? [{ icon: Users, label: "Funcionários", path: "/users" }] 
      : []),
  ];

  // Submenu de gestão de stock
  const stockManagementItems = [
    { icon: Warehouse, label: "Fornecedores", path: "/inventory/suppliers" },
    { icon: ClipboardCheck, label: "Categorias", path: "/inventory/categories" },
    { icon: ShoppingCart, label: "Peças", path: "/inventory/parts" },
    { icon: ArrowDownCircle, label: "Entradas", path: "/inventory/entries" },
    { icon: ArrowUpCircle, label: "Saídas", path: "/inventory/exits" },
    { icon: Wrench, label: "Ajustes", path: "/inventory/adjustments" },
  ];

  // Verificar se alguma rota de gestão de stock está ativa
  const isStockManagementActive = stockManagementItems.some(
    item => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
  );

  // Abrir submenu de gestão de stock automaticamente se estivermos em uma página de gestão
  useEffect(() => {
    if (isStockManagementActive) {
      setStockMenuOpen(true);
    }
  }, [location.pathname, isStockManagementActive]);

  // Permitir acesso apenas se houver user autenticado
  if (!user) return null;

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
                  {mainMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={location.pathname === item.path ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        location.pathname === item.path && "bg-secondary",
                        item.highlight && "font-semibold"
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
                  
                  {/* Submenu Gerir Stock no Mobile */}
                  <Collapsible open={stockMenuOpen} onOpenChange={setStockMenuOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant={isStockManagementActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isStockManagementActive && "bg-secondary"
                        )}
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Gerir Stock
                        {stockMenuOpen ? (
                          <ChevronUp className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-4 space-y-1 mt-1">
                        {stockManagementItems.map((item) => (
                          <Button
                            key={item.path}
                            variant={location.pathname === item.path ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start text-sm",
                              location.pathname === item.path && "bg-secondary"
                            )}
                            onClick={() => {
                              navigate(item.path);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <item.icon className="h-3 w-3 mr-2" />
                            {item.label}
                          </Button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </nav>
                <div className="p-4 border-t border-border bg-card">
                  <div className="mb-2 text-xs text-muted-foreground truncate">
                    {user?.email || ""}
                  </div>
                  <div className="space-y-2">
                    {(userRole === "admin" || userRole === "owner" || isSuperAdmin) && (
                      <Button
                        variant={location.pathname === "/users" ? "secondary" : "outline"}
                        className={cn(
                          "w-full justify-start",
                          location.pathname === "/users" && "bg-secondary"
                        )}
                        onClick={() => {
                          navigate("/users");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Funcionários
                      </Button>
                    )}
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
            {mainMenuItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                className={cn(
                  "w-full",
                  sidebarCollapsed ? "justify-center px-0" : "justify-start",
                  location.pathname === item.path && "bg-secondary",
                  item.highlight && !sidebarCollapsed && "font-semibold"
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
                {user?.email || ""}
              </div>
            )}
            <div className="space-y-2">
              {/* Submenu Gerir Stock */}
              {!sidebarCollapsed ? (
                <Collapsible open={stockMenuOpen} onOpenChange={setStockMenuOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isStockManagementActive ? "secondary" : "outline"}
                      className={cn(
                        "w-full justify-start",
                        isStockManagementActive && "bg-secondary"
                      )}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Gerir Stock
                      {stockMenuOpen ? (
                        <ChevronUp className="h-4 w-4 ml-auto" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-4 space-y-1 mt-1">
                      {stockManagementItems.map((item) => (
                        <Button
                          key={item.path}
                          variant={location.pathname === item.path ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start text-sm",
                            location.pathname === item.path && "bg-secondary"
                          )}
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="h-3 w-3 mr-2" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Button
                  variant={isStockManagementActive ? "secondary" : "outline"}
                  className={cn(
                    "w-full justify-center px-0",
                    isStockManagementActive && "bg-secondary"
                  )}
                  onClick={() => navigate("/inventory/suppliers")}
                  title="Gerir Stock"
                >
                  <Wrench className="h-4 w-4" />
                </Button>
              )}
              
              {(userRole === "admin" || userRole === "owner" || isSuperAdmin) && (
                <Button
                  variant={location.pathname === "/users" ? "secondary" : "outline"}
                  className={cn(
                    "w-full",
                    sidebarCollapsed ? "justify-center px-0" : "justify-start",
                    location.pathname === "/users" && "bg-secondary"
                  )}
                  onClick={() => navigate("/users")}
                  title={sidebarCollapsed ? "Funcionários" : undefined}
                >
                  <Users className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
                  {!sidebarCollapsed && "Funcionários"}
                </Button>
              )}
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