import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyUser, getSubdomainFromHost } from "@/lib/authUtils";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      console.log("useCompany: Starting to fetch company ID...");
      setLoading(true);
      
      try {
        // 1. Primeiro, tentar detectar subdomain da URL
        const detectedSubdomain = getSubdomainFromHost();
        console.log("useCompany: Detected subdomain:", detectedSubdomain);
        
        if (detectedSubdomain) {
          setSubdomain(detectedSubdomain);
          
          // Buscar company pelo subdomain
          const { data: company, error } = await supabase
            .from("companies")
            .select("id")
            .eq("subdomain", detectedSubdomain)
            .maybeSingle();
          
          console.log("useCompany: Company by subdomain:", { company, error });
          
          if (company && !error) {
            console.log("useCompany: Found company by subdomain:", company.id);
            setCompanyId(company.id);
            setLoading(false);
            return;
          }
        }

        // 2. Se não encontrou por subdomain, verificar company_user logado
        const companyUser = getCurrentCompanyUser();
        console.log("useCompany: Company user from localStorage:", companyUser);
        
        if (companyUser) {
          console.log("useCompany: Found company user, using company_id:", companyUser.company_id);
          setCompanyId(companyUser.company_id);
          setLoading(false);
          return;
        }

        // 3. Se não, verificar auth user (proprietário)
        console.log("useCompany: Checking auth user...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("useCompany: Error getting auth user:", userError);
        }
        
        console.log("useCompany: Auth user:", user ? { id: user.id, email: user.email } : null);
        
        if (!user) {
          console.log("useCompany: No auth user found");
          setCompanyId(null);
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("company_id, is_active")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          console.error("Profile error details:", JSON.stringify(profileError, null, 2));
        }

        if (profile) {
          console.log("User profile found:", { 
            company_id: profile.company_id, 
            is_active: profile.is_active,
            user_id: user.id 
          });
          setCompanyId(profile.company_id);
        } else {
          console.warn("User profile not found for user:", user.id);
          console.warn("This may indicate a problem with RLS policies or the user profile was not created");
        }
      } catch (error) {
        console.error("Error fetching company ID:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setCompanyId(null);
      } finally {
        setLoading(false);
        // Note: companyId aqui pode não estar atualizado ainda devido ao estado assíncrono
        // O valor será atualizado no próximo render
      }
    };

    fetchCompanyId();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCompanyId();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Log quando companyId mudar
  useEffect(() => {
    console.log("useCompany: companyId changed:", companyId);
    console.log("useCompany: loading:", loading);
    console.log("useCompany: subdomain:", subdomain);
  }, [companyId, loading, subdomain]);

  return { companyId, loading, subdomain };
}

