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
  const [companyUser, setCompanyUserState] = useState<CompanyUser | null>(null);

  useEffect(() => {
    // Carregar usuário da empresa do localStorage
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

