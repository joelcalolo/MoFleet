import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyUser, getSubdomainFromHost } from "@/lib/authUtils";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        // 1. Primeiro, tentar detectar subdomain da URL
        const detectedSubdomain = getSubdomainFromHost();
        
        if (detectedSubdomain) {
          setSubdomain(detectedSubdomain);
          
          // Buscar company pelo subdomain
          const { data: company, error } = await supabase
            .from("companies")
            .select("id")
            .eq("subdomain", detectedSubdomain)
            .maybeSingle();
          
          if (company && !error) {
            setCompanyId(company.id);
            setLoading(false);
            return;
          }
        }

        // 2. Se não encontrou por subdomain, verificar company_user logado
        const companyUser = getCurrentCompanyUser();
        if (companyUser) {
          setCompanyId(companyUser.company_id);
          setLoading(false);
          return;
        }

        // 3. Se não, verificar auth user (proprietário)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCompanyId(null);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("company_id")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setCompanyId(profile.company_id);
        }
      } catch (error) {
        console.error("Error fetching company ID:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyId();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCompanyId();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { companyId, loading, subdomain };
}

