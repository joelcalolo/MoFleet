import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Car, Calendar, Users, LayoutDashboard, LogOut, UserCircle, Settings, Truck, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // Não redirecionar se estiver na landing page, auth ou páginas legais
      const publicPaths = ["/", "/auth", "/terms", "/privacy"];
      if (!session && !publicPaths.some(path => location.pathname === path || location.pathname.startsWith(path + "/"))) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Não redirecionar se estiver na landing page, auth ou páginas legais
      const publicPaths = ["/", "/auth", "/terms", "/privacy"];
      if (!session && !publicPaths.some(path => location.pathname === path || location.pathname.startsWith(path + "/"))) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  if (!user) return null;

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Fixo */}
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
                {user.email}
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

      {/* Conteúdo Principal com margem para o sidebar */}
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;