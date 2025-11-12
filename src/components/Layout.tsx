import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Car, Calendar, Users, LayoutDashboard, LogOut, UserCircle, Settings, Truck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="MoFleet" className="h-10 w-auto" />
            <h1 className="text-xl font-bold">MoFleet</h1>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  location.pathname === item.path && "bg-secondary"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 w-64 p-6 border-t border-border bg-card">
          <div className="mb-2 text-sm text-muted-foreground truncate">
            {user.email}
          </div>
          <div className="space-y-2">
            <Button
              variant={location.pathname === "/settings" ? "secondary" : "outline"}
              className={cn(
                "w-full justify-start",
                location.pathname === "/settings" && "bg-secondary"
              )}
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;