import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Plus, Users, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickActionSheet } from "./QuickActionSheet";

export const MobileBottomBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const navItems = [
    {
      id: "dashboard",
      label: "Início",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "reservations",
      label: "Reservas",
      path: "/reservations",
      icon: CalendarDays,
    },
    // Center button is handled separately
    {
      id: "customers",
      label: "Clientes",
      path: "/customers",
      icon: Users,
    },
    {
      id: "fleet",
      label: "Frota",
      path: "/fleet",
      icon: Car,
    },
  ];

  const isCurrentPath = (path: string) => {
    return location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));
  };

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 pb-safe pt-1.5 transition-all duration-300 md:hidden"
        aria-label="Navegação Principal Mobile"
      >
        <div className="flex items-center justify-around h-14 relative max-w-md mx-auto">
          {/* First 2 items: Início, Reservas */}
          {navItems.slice(0, 2).map((item) => {
            const active = isCurrentPath(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 group relative",
                  active 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground hover:text-foreground font-normal"
                )}
              >
                <div className={cn(
                  "p-1 rounded-full transition-colors relative",
                  active && "bg-primary/10 text-primary"
                )}>
                  <Icon className={cn("h-5 w-5 transition-transform group-active:scale-110", active && "stroke-[2.25px]")} />
                </div>
                <span className="text-[10px] tracking-tight truncate mt-0.5">
                  {item.label}
                </span>

                {/* Active Bar Indicator */}
                {active && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-200" />
                )}
              </button>
            );
          })}

          {/* Center Elevated Action Button: + (Nova Reserva) */}
          <div className="flex-1 flex items-center justify-center relative -top-3">
            <button
              onClick={() => setQuickActionOpen(true)}
              aria-label="Criar nova reserva"
              className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-primary via-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 active:scale-90 hover:scale-105 transition-all duration-200 ring-4 ring-card"
            >
              <Plus className="h-6 w-6 stroke-[2.5px] group-hover:rotate-90 transition-transform duration-300" />
              
              {/* Pulse glow background effect */}
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-20 pointer-events-none" />
            </button>
          </div>

          {/* Next 2 items: Clientes, Frota */}
          {navItems.slice(2, 4).map((item) => {
            const active = isCurrentPath(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 group relative",
                  active 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground hover:text-foreground font-normal"
                )}
              >
                <div className={cn(
                  "p-1 rounded-full transition-colors relative",
                  active && "bg-primary/10 text-primary"
                )}>
                  <Icon className={cn("h-5 w-5 transition-transform group-active:scale-110", active && "stroke-[2.25px]")} />
                </div>
                <span className="text-[10px] tracking-tight truncate mt-0.5">
                  {item.label}
                </span>

                {/* Active Bar Indicator */}
                {active && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-200" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Action Sheet triggered by center + button */}
      <QuickActionSheet 
        open={quickActionOpen} 
        onOpenChange={setQuickActionOpen} 
      />
    </>
  );
};
