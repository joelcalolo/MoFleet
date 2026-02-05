import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CompanyUser, getCurrentCompanyUser, logoutCompanyUser } from "@/lib/authUtils";

interface CompanyUserContextType {
  companyUser: CompanyUser | null;
  setCompanyUser: (user: CompanyUser | null) => void;
  logout: () => void;
  isGerente: boolean;
  isTecnico: boolean;
}

const CompanyUserContext = createContext<CompanyUserContextType | undefined>(undefined);

export function CompanyUserProvider({ children }: { children: ReactNode }) {
  // Inicializar a partir do localStorage de forma síncrona para evitar race no Layout:
  // no primeiro render já temos companyUser correto e o redirect não dispara antes de hidratar.
  const [companyUser, setCompanyUserState] = useState<CompanyUser | null>(() => getCurrentCompanyUser());

  useEffect(() => {
    // Sincronizar com localStorage se outra aba/contexto alterar (opcional)
    const stored = getCurrentCompanyUser();
    setCompanyUserState(stored);
  }, []);

  const setCompanyUser = (user: CompanyUser | null) => {
    setCompanyUserState(user);
    if (!user) {
      logoutCompanyUser();
    }
  };

  const logout = () => {
    setCompanyUserState(null);
    logoutCompanyUser();
  };

  const isGerente = companyUser?.role === 'gerente';
  const isTecnico = companyUser?.role === 'tecnico';

  return (
    <CompanyUserContext.Provider
      value={{
        companyUser,
        setCompanyUser,
        logout,
        isGerente,
        isTecnico,
      }}
    >
      {children}
    </CompanyUserContext.Provider>
  );
}

export function useCompanyUser() {
  const context = useContext(CompanyUserContext);
  if (context === undefined) {
    throw new Error("useCompanyUser must be used within a CompanyUserProvider");
  }
  return context;
}

