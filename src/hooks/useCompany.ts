import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyUser, getSubdomainFromHost, logoutCompanyUser } from "@/lib/authUtils";

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
          
          // Buscar company pelo subdomain usando função RPC (bypassa RLS)
          console.log("useCompany: Searching company by subdomain via RPC:", detectedSubdomain);
          const { data: companyData, error } = await supabase
            .rpc('get_company_by_subdomain', { p_subdomain: detectedSubdomain });
          
          console.log("useCompany: Company by subdomain (RPC):", { 
            company: companyData, 
            error: error ? { message: error.message, code: error.code, details: error.details } : null 
          });
          
          if (error) {
            console.error("useCompany: Error fetching company by subdomain:", error);
            // Tentar método direto como fallback
            const { data: companyDirect, error: errorDirect } = await supabase
              .from("companies")
              .select("id")
              .eq("subdomain", detectedSubdomain)
              .maybeSingle();
            
            if (companyDirect && !errorDirect) {
              console.log("useCompany: Found company by subdomain (direct fallback):", companyDirect.id);
              setCompanyId(companyDirect.id);
              setLoading(false);
              return;
            }
          } else if (companyData && companyData.id) {
            console.log("useCompany: Found company by subdomain:", companyData.id);
            setCompanyId(companyData.id);
            setLoading(false);
            return;
          } else {
            console.warn("useCompany: No company found for subdomain:", detectedSubdomain);
          }
        }

        // 2. Verificar auth user primeiro (proprietário/admin)
        console.log("useCompany: Checking auth user...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("useCompany: Error getting auth user:", userError);
        }
        
        console.log("useCompany: Auth user:", user ? { id: user.id, email: user.email } : null);
        
        // 3. Se não há auth user, verificar company_user logado
        if (!user) {
          const companyUser = getCurrentCompanyUser();
          console.log("useCompany: Company user from localStorage:", companyUser);
          
          if (companyUser) {
            console.log("useCompany: Found company user (no auth user), using company_id:", companyUser.company_id);
            setCompanyId(companyUser.company_id);
            setLoading(false);
            return;
          } else {
            console.log("useCompany: No auth user and no company user found");
            setCompanyId(null);
            setLoading(false);
            return;
          }
        }
        
        // 4. Se há auth user, limpar company_user se existir (owner deve usar user_profile)
        const companyUser = getCurrentCompanyUser();
        if (companyUser) {
          console.warn("useCompany: Found both auth user and company_user. Clearing company_user to use user_profile.");
          logoutCompanyUser();
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

