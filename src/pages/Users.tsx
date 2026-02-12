import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { UserForm } from "@/components/users/UserForm";
import { UserList } from "@/components/users/UserList";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string;
  name?: string;
  role: "owner" | "admin" | "user" | "super_admin";
  is_active: boolean;
  created_at: string;
  auth_users?: {
    email?: string;
  };
}

export interface CompanyUser {
  id: string;
  username: string;
  role: "gerente" | "tecnico";
  is_active: boolean;
  created_at: string;
}

export type User = UserProfile | CompanyUser;

const Users = () => {
  const navigate = useNavigate();
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (userRole === "admin" || userRole === "owner") {
      fetchUsers();
    }
  }, [userRole]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
        toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
        navigate("/dashboard");
        return;
      }

      setUserRole(profile.role);
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/dashboard");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Buscar user_profiles (usuários com email)
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select(`
          id,
          user_id,
          name,
          role,
          is_active,
          created_at,
          auth_users:user_id (
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar company_users (usuários internos)
      const { data: companyUsersData, error: companyUsersError } = await supabase
        .from("company_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (companyUsersError) throw companyUsersError;

      setUserProfiles((profiles || []) as UserProfile[]);
      setCompanyUsers((companyUsersData || []) as CompanyUser[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar funcionários");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  // Verificar acesso antes de renderizar
  if (userRole !== "admin" && userRole !== "owner") {
    return null;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestão de Funcionários</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Cadastre e gerencie os funcionários do sistema</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingUser ? "Editar Funcionário" : "Novo Funcionário"}</CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm user={editingUser} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <UserList
            userProfiles={userProfiles}
            companyUsers={companyUsers}
            loading={loading}
            onEdit={handleEdit}
            onRefresh={fetchUsers}
          />
        )}
      </div>
    </Layout>
  );
};

export default Users;
