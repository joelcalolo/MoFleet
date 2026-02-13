import { supabase } from "@/integrations/supabase/client";

/**
 * Busca o nome de um funcionário baseado em user_id (auth.users / user_profiles).
 * companyUserId é legado e ignorado (tabela company_users removida).
 * @param userId ID do usuário em auth.users (user_profiles)
 * @param _companyUserId Legado, ignorado
 * @returns Nome do funcionário ou null se não encontrado
 */
export async function getEmployeeName(
  userId: string | null,
  _companyUserId?: string | null
): Promise<string | null> {
  if (!userId) return null;

  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("name, user_id")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user profile:", error);
    }

    if (profile?.name) {
      return profile.name;
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (user?.email) {
      return user.email;
    }
  } catch (error) {
    console.error("Error in getEmployeeName for userId:", error);
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
 * Busca múltiplos nomes de funcionários de uma vez (apenas user_profiles).
 * @param userIds Array de user_ids
 * @returns Map com IDs como chave e nomes como valor
 */
export async function getEmployeeNamesBatch(
  userIds: string[] = []
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();

  if (userIds.length === 0) return nameMap;

  try {
    const { data: profiles, error } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", userIds);

    if (error) {
      console.error("Error fetching user profiles batch:", error);
    } else if (profiles) {
      for (const profile of profiles) {
        if (profile.name) {
          nameMap.set(profile.user_id, profile.name);
        } else {
          nameMap.set(profile.user_id, profile.user_id.substring(0, 8));
        }
      }
    }
  } catch (error) {
    console.error("Error in getEmployeeNamesBatch for userIds:", error);
  }

  return nameMap;
}
