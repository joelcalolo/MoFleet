// Hook simplificado - sistema de única empresa, não precisa mais de company_id
export function useCompany() {
  // Retorna sempre null para companyId já que não há mais multi-tenant
  return { companyId: null, loading: false, subdomain: null };
}
