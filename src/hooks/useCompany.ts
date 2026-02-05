import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyUser, getSubdomainFromHost, logoutCompanyUser } from "@/lib/authUtils";
import type { Session, User } from "@supabase/supabase-js";

const isDev = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (isDev) console.log(...args);
}

function logWarn(...args: unknown[]) {
  if (isDev) console.warn(...args);
}

function logError(...args: unknown[]) {
  if (isDev) console.error(...args);
}

/** Debounce helper */
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn(...args);
    }, ms);
  };
}

export function useCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const lastKnownCompanyIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveCompanyFromUser(user: User): Promise<string | null> {
      const companyUser = getCurrentCompanyUser();
      if (companyUser) {
        log("useCompany: Found both auth user and company_user. Clearing company_user to use user_profile.");
        logoutCompanyUser();
      }
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("company_id, is_active")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError) {
        logError("Error fetching user profile:", profileError);
        return null;
      }
      if (profile) {
        log("User profile found:", { company_id: profile.company_id, is_active: profile.is_active, user_id: user.id });
        return profile.company_id;
      }
      logWarn("User profile not found for user:", user.id);
      return null;
    }

    async function fetchCompanyId(sessionFromCallback: Session | null | undefined) {
      const hasExistingCompany = lastKnownCompanyIdRef.current != null;
      if (!hasExistingCompany) {
        setLoading(true);
      }

      try {
        const detectedSubdomain = getSubdomainFromHost();
        log("useCompany: Detected subdomain:", detectedSubdomain);

        if (detectedSubdomain) {
          setSubdomain(detectedSubdomain);
          const { data: companyData, error } = await supabase.rpc("get_company_by_subdomain", {
            p_subdomain: detectedSubdomain,
          });
          log("useCompany: Company by subdomain (RPC):", {
            company: companyData,
            error: error ? { message: error.message } : null,
          });
          if (error) {
            const { data: companyDirect, error: errorDirect } = await supabase
              .from("companies")
              .select("id")
              .eq("subdomain", detectedSubdomain)
              .maybeSingle();
            if (companyDirect && !errorDirect) {
              if (cancelled) return;
              lastKnownCompanyIdRef.current = companyDirect.id;
              setCompanyId(companyDirect.id);
              setLoading(false);
              return;
            }
          } else if (companyData?.id) {
            if (cancelled) return;
            lastKnownCompanyIdRef.current = companyData.id;
            setCompanyId(companyData.id);
            setLoading(false);
            return;
          }
        }

        let user: User | null = null;
        if (sessionFromCallback !== undefined) {
          user = sessionFromCallback?.user ?? null;
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (cancelled) return;
          user = session?.user ?? null;
        }

        log("useCompany: Auth user:", user ? { id: user.id, email: user.email } : null);

        if (!user) {
          const companyUser = getCurrentCompanyUser();
          log("useCompany: Company user from localStorage:", companyUser);
          if (companyUser) {
            if (cancelled) return;
            lastKnownCompanyIdRef.current = companyUser.company_id;
            setCompanyId(companyUser.company_id);
            setLoading(false);
            return;
          }
          if (cancelled) return;
          lastKnownCompanyIdRef.current = null;
          setCompanyId(null);
          setLoading(false);
          return;
        }

        const resolvedId = await resolveCompanyFromUser(user);
        if (cancelled) return;
        if (resolvedId != null) {
          lastKnownCompanyIdRef.current = resolvedId;
          setCompanyId(resolvedId);
        } else if (!lastKnownCompanyIdRef.current) {
          setCompanyId(null);
        }
      } catch (error) {
        logError("Error fetching company ID:", error);
        if (cancelled) return;
        if (!lastKnownCompanyIdRef.current) {
          setCompanyId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      fetchCompanyId(session);
    });

    const debouncedRefetch = debounce((session: Session | null) => {
      if (cancelled) return;
      fetchCompanyId(session);
    }, 400);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      debouncedRefetch(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { companyId, loading, subdomain };
}
