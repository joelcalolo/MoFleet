import { useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  UserPlus,
  Car,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface QuickActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickActionSheet = ({ open, onOpenChange }: QuickActionSheetProps) => {
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const actions = [
    {
      label: "Nova Reserva",
      description: "Registar novo aluguer ou agendamento de veículo",
      path: "/reservations?new=true",
      icon: CalendarPlus,
      isPrimary: true,
      iconBg: "",
      badge: "Principal",
    },
    {
      label: "Novo Cliente",
      description: "Cadastrar cliente no sistema",
      path: "/customers?new=true",
      icon: UserPlus,
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Novo Veículo",
      description: "Adicionar carro à frota",
      path: "/cars?new=true",
      icon: Car,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Entrada no Stock",
      description: "Registar nova entrada de peças/material",
      path: "/inventory/entries",
      icon: PackagePlus,
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-6 bg-card border-t border-border max-h-[85vh] overflow-y-auto"
      >
        {/* Handle bar */}
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-6" />

        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">Ações Rápidas</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Selecione o que deseja criar agora
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            if (action.isPrimary) {
              return (
                <button
                  key={action.path}
                  onClick={() => handleAction(action.path)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md active:scale-[0.98] transition-all text-left group"
                >
                  <div className="p-3 rounded-xl bg-white/20 shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base flex items-center gap-2">
                      {action.label}
                      {action.badge && (
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-primary-foreground/80 font-normal mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={action.path}
                onClick={() => handleAction(action.path)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-muted/60 hover:bg-muted border border-border/50 text-foreground active:scale-[0.98] transition-all text-left group"
              >
                <div className={`p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform ${action.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-foreground">{action.label}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full rounded-xl py-5 text-muted-foreground font-medium"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
