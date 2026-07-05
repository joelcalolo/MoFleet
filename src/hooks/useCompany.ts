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
        
        if (user && detectedSubdomain) {
          // Get company by subdomain
          const { data: companyData } = await supabase
            .rpc('get_company_by_subdomain', { p_subdomain: detectedSubdomain });
          
          if (companyData && companyData.length > 0) {
            setCompanyId(companyData[0].id);
          }
        } else if (user) {
          // Fallback: get user's company from user_profiles
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('user_id', user.id)
            .single();
          
          if (profileData) {
            setCompanyId(profileData.company_id);
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
