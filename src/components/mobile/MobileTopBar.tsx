import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Car, 
  Calendar, 
  FileText, 
  Package, 
  Warehouse, 
  ClipboardCheck, 
  ShoppingCart, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wrench, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ShieldCheck,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";

interface MobileTopBarProps {
  appName: string;
  logoUrl: string;
  user: User | null;
  userRole: string | null;
  isSuperAdmin: boolean;
  handleLogout: () => Promise<void>;
}

export const MobileTopBar = ({
  appName,
  logoUrl,
  user,
  userRole,
  isSuperAdmin,
  handleLogout,
}: MobileTopBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stockMenuOpen, setStockMenuOpen] = useState(false);

  // Submenu de gestão de stock
  const stockManagementItems = [
    { icon: Package, label: "Visão Geral", path: "/inventory" },
    { icon: Warehouse, label: "Fornecedores", path: "/inventory/suppliers" },
    { icon: ClipboardCheck, label: "Categorias", path: "/inventory/categories" },
    { icon: ShoppingCart, label: "Peças", path: "/inventory/parts" },
    { icon: ArrowDownCircle, label: "Entradas", path: "/inventory/entries" },
    { icon: ArrowUpCircle, label: "Saídas", path: "/inventory/exits" },
    { icon: Wrench, label: "Ajustes", path: "/inventory/adjustments" },
  ];

  const isStockManagementActive = stockManagementItems.some(
    (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
  );

  const navigateTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/80 px-4 h-14 flex items-center justify-between shadow-sm md:hidden">
      {/* Branding */}
      <div className="flex items-center gap-2.5 min-w-0" onClick={() => navigate("/dashboard")}>
        <img 
          src={logoUrl} 
          alt={appName} 
          className="h-8 w-auto object-contain shrink-0" 
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <span className="font-bold text-base tracking-tight truncate text-foreground">
          {appName}
        </span>
      </div>

      {/* Menu Drawer Button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-muted text-foreground relative active:scale-95 transition-transform"
            aria-label="Abrir Menu Principal"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[85vw] max-w-xs p-0 flex flex-col bg-card border-l border-border">
          {/* Header do Menu Mobile */}
          <div className="p-5 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {user?.email?.[0].toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-foreground">
                  {user?.email || "Usuário"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {userRole ? userRole.toUpperCase() : "OPERADOR"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Páginas Secundárias (Resto das Páginas) */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {/* Secção: Gestão da Operação */}
            <div>
              <p className="px-3 text-[11px] font-bold text-muted-foreground tracking-wider uppercase mb-2">
                Gestão & Operação
              </p>
              <div className="space-y-1">
                <Button
                  variant={location.pathname === "/schedule" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start rounded-xl text-sm font-medium h-10 px-3",
                    location.pathname === "/schedule" && "bg-secondary text-secondary-foreground font-semibold"
                  )}
                  onClick={() => navigateTo("/schedule")}
                >
                  <Calendar className="h-4 w-4 mr-3 text-primary" />
                  Agenda Interativa
                </Button>

                <Button
                  variant={location.pathname === "/cars" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start rounded-xl text-sm font-medium h-10 px-3",
                    location.pathname === "/cars" && "bg-secondary text-secondary-foreground font-semibold"
                  )}
                  onClick={() => navigateTo("/cars")}
                >
                  <Car className="h-4 w-4 mr-3 text-blue-500" />
                  Carros da Frota
                </Button>

                <Button
                  variant={location.pathname === "/rentals-summary" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start rounded-xl text-sm font-medium h-10 px-3",
                    location.pathname === "/rentals-summary" && "bg-secondary text-secondary-foreground font-semibold"
                  )}
                  onClick={() => navigateTo("/rentals-summary")}
                >
                  <FileText className="h-4 w-4 mr-3 text-emerald-500" />
                  Resumo de Alugueres
                </Button>
              </div>
            </div>

            {/* Secção: Gestão de Stock */}
            <div>
              <p className="px-3 text-[11px] font-bold text-muted-foreground tracking-wider uppercase mb-2">
                Inventário & Peças
              </p>
              <Collapsible open={stockMenuOpen || isStockManagementActive} onOpenChange={setStockMenuOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isStockManagementActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-between rounded-xl text-sm font-medium h-10 px-3",
                      isStockManagementActive && "bg-secondary text-secondary-foreground font-semibold"
                    )}
                  >
                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 mr-3 text-purple-500" />
                      <span>Gestão de Stock</span>
                    </div>
                    {stockMenuOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-6 pr-1 space-y-1 mt-1 border-l-2 border-border ml-4">
                    {stockManagementItems.map((item) => (
                      <Button
                        key={item.path}
                        variant={location.pathname === item.path ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-xs rounded-lg h-9 px-3",
                          location.pathname === item.path && "bg-secondary/80 font-semibold"
                        )}
                        onClick={() => navigateTo(item.path)}
                      >
                        <item.icon className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Secção: Administração */}
            <div>
              <p className="px-3 text-[11px] font-bold text-muted-foreground tracking-wider uppercase mb-2">
                Sistema & Definições
              </p>
              <div className="space-y-1">
                {(userRole === "admin" || userRole === "owner" || isSuperAdmin) && (
                  <Button
                    variant={location.pathname === "/users" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start rounded-xl text-sm font-medium h-10 px-3",
                      location.pathname === "/users" && "bg-secondary text-secondary-foreground font-semibold"
                    )}
                    onClick={() => navigateTo("/users")}
                  >
                    <Users className="h-4 w-4 mr-3 text-amber-500" />
                    Funcionários & Permissões
                  </Button>
                )}

                <Button
                  variant={location.pathname === "/settings" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start rounded-xl text-sm font-medium h-10 px-3",
                    location.pathname === "/settings" && "bg-secondary text-secondary-foreground font-semibold"
                  )}
                  onClick={() => navigateTo("/settings")}
                >
                  <Settings className="h-4 w-4 mr-3 text-gray-500" />
                  Configurações
                </Button>
              </div>
            </div>
          </div>

          {/* Footer do Menu Mobile: Logout */}
          <div className="p-4 border-t border-border/60 bg-muted/20">
            <Button
              variant="outline"
              className="w-full justify-center rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium h-10 transition-colors"
              onClick={async () => {
                setMobileMenuOpen(false);
                await handleLogout();
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
