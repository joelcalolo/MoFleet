import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyData {
  companyId: string | null;
  subdomain: string | null;
  loading: boolean;
}

export function useCompany(): CompanyData {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanyData() {
      try {
        // Detect subdomain from URL
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        // If we have a subdomain (e.g., empresa.mofleet.com)
        let detectedSubdomain = null;
        if (parts.length >= 3) {
          detectedSubdomain = parts[0];
        }
        
        setSubdomain(detectedSubdomain);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          let foundCompanyId = null;

          if (detectedSubdomain) {
            // Get company by subdomain
            const { data: companyData } = await supabase
              .rpc('get_company_by_subdomain', { p_subdomain: detectedSubdomain });
            
            if (companyData && companyData.length > 0) {
              foundCompanyId = companyData[0].id;
            }
          }

          // Fallback: get user's company from user_profiles if not found by subdomain
          if (!foundCompanyId) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('company_id')
              .eq('user_id', user.id)
              .single();
            
            if (profileData) {
              foundCompanyId = profileData.company_id;
            }
          }

          if (foundCompanyId) {
            setCompanyId(foundCompanyId);
          } else {
            // Se ainda não encontrou e houver um companyUser no localStorage (usuário híbrido)
            const storedCompanyUser = localStorage.getItem('companyUser');
            if (storedCompanyUser) {
              try {
                const companyUser = JSON.parse(storedCompanyUser);
                if (companyUser && companyUser.company_id) {
                  setCompanyId(companyUser.company_id);
                }
              } catch (e) {
                console.error("Error parsing companyUser from localStorage", e);
              }
            }
          }
        } else {
          // Usuário não autenticado no Supabase Auth, verificar localStorage (híbrido)
          const storedCompanyUser = localStorage.getItem('companyUser');
          if (storedCompanyUser) {
            try {
              const companyUser = JSON.parse(storedCompanyUser);
              if (companyUser && companyUser.company_id) {
                setCompanyId(companyUser.company_id);
              }
            } catch (e) {
              console.error("Error parsing companyUser from localStorage", e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading company data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, []);

  return { companyId, subdomain, loading };
}
