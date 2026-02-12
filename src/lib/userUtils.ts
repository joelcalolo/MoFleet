import { supabase } from "@/integrations/supabase/client";

/**
 * Busca o nome de um funcionário baseado em user_id ou company_user_id
 * @param userId ID do usuário em auth.users (user_profiles)
 * @param companyUserId ID do usuário em company_users
 * @returns Nome do funcionário ou null se não encontrado
 */
export async function getEmployeeName(
  userId: string | null,
  companyUserId: string | null
): Promise<string | null> {
  // Se tiver user_id, buscar em user_profiles
  if (userId) {
    try {
      // Buscar user_profile com join em auth.users para pegar email
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("name, user_id")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = não encontrado, que é ok
        console.error("Error fetching user profile:", error);
      }

      // Se tiver nome, retornar
      if (profile?.name) {
        return profile.name;
      }

      // Se não tiver nome, buscar email do auth.users
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (user?.email) {
        return user.email;
      }
    } catch (error) {
      console.error("Error in getEmployeeName for userId:", error);
    }
  }

  // Se tiver company_user_id, buscar em company_users
  if (companyUserId) {
    try {
      const { data: companyUser, error } = await supabase
        .from("company_users")
        .select("username")
        .eq("id", companyUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching company user:", error);
      }

      if (companyUser?.username) {
        return companyUser.username;
      }
    } catch (error) {
      console.error("Error in getEmployeeName for companyUserId:", error);
    }
  }

  return null;
}

/**
 * Busca o nome do funcionário atual (autenticado)
 * @returns Nome do funcionário atual ou null
 */
export async function getCurrentEmployeeName(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return getEmployeeName(user.id, null);
  } catch (error) {
    console.error("Error getting current employee name:", error);
    return null;
  }
}

/**
 * Busca múltiplos nomes de funcionários de uma vez (otimizado)
 * @param userIds Array de user_ids
 * @param companyUserIds Array de company_user_ids
 * @returns Map com IDs como chave e nomes como valor
 */
export async function getEmployeeNamesBatch(
  userIds: string[] = [],
  companyUserIds: string[] = []
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();

  // Buscar user_profiles em batch
  if (userIds.length > 0) {
    try {
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      if (error) {
        console.error("Error fetching user profiles batch:", error);
      } else if (profiles) {
        // Para cada profile, buscar email se não tiver name
        for (const profile of profiles) {
          if (profile.name) {
            nameMap.set(profile.user_id, profile.name);
          } else {
            // Tentar buscar email (requer admin API, então vamos usar uma abordagem diferente)
            // Por enquanto, usar user_id como fallback
            nameMap.set(profile.user_id, profile.user_id.substring(0, 8));
          }
        }
      }
    } catch (error) {
      console.error("Error in getEmployeeNamesBatch for userIds:", error);
    }
  }

  // Buscar company_users em batch
  if (companyUserIds.length > 0) {
    try {
      const { data: companyUsers, error } = await supabase
        .from("company_users")
        .select("id, username")
        .in("id", companyUserIds);

      if (error) {
        console.error("Error fetching company users batch:", error);
      } else if (companyUsers) {
        for (const user of companyUsers) {
          if (user.username) {
            nameMap.set(user.id, user.username);
          }
        }
      }
    } catch (error) {
      console.error("Error in getEmployeeNamesBatch for companyUserIds:", error);
    }
  }

  return nameMap;
}
