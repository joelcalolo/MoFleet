import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
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

  return { companyId, loading };
}

