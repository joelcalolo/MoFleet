import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { hashPassword } from "@/lib/authUtils";
import { handleError, logError } from "@/lib/errorHandler";
import { useCompanyUser } from "@/contexts/CompanyUserContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CompanyUser {
  id: string;
  username: string;
  role: 'gerente' | 'tecnico';
  is_active: boolean;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  subdomain: string | null;
}

const CompanyUsers = () => {
  const { companyId: defaultCompanyId } = useCompany();
  const { companyUser: currentCompanyUser, isGerente } = useCompanyUser();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [companySubdomain, setCompanySubdomain] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "tecnico" as "gerente" | "tecnico",
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Verificar se é super_admin ou owner/admin
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, company_id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        const isAdmin = profile?.role === 'super_admin';
        const isOwnerOrAdminRole = profile?.role === 'owner' || profile?.role === 'admin';
        
        setIsSuperAdmin(isAdmin);
        setIsOwnerOrAdmin(isOwnerOrAdminRole);
        
        // Verificar se pode gerenciar usuários
        const canManage = isAdmin || isOwnerOrAdminRole || isGerente;
        setCanManageUsers(canManage);
        
        // Se for super_admin, buscar todas as empresas
        if (isAdmin) {
          const { data: allCompanies } = await supabase
            .from("companies")
            .select("id, name, subdomain")
            .order("name");
          if (allCompanies) {
            setCompanies(allCompanies);
            // Se não tem empresa selecionada, usar a primeira ou a default
            setSelectedCompanyId((prev) => prev || defaultCompanyId || allCompanies[0]?.id || null);
          }
        } else {
          // Se não for super_admin, usar companyId padrão ou do company_user
          const companyId = defaultCompanyId || currentCompanyUser?.company_id || profile?.company_id || null;
          setSelectedCompanyId(companyId);
        }
      } else if (currentCompanyUser && isGerente) {
        // Se não há auth user mas há company_user gerente logado
        setCanManageUsers(true);
        setSelectedCompanyId(currentCompanyUser.company_id);
      }
    };
    checkPermissions();
  }, [defaultCompanyId, currentCompanyUser, isGerente]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchUsers();
      fetchSubdomain();
    }
  }, [selectedCompanyId]);

  const fetchSubdomain = async () => {
    if (!selectedCompanyId) return;
    try {
      const { data: company } = await supabase
        .from("companies")
        .select("subdomain")
        .eq("id", selectedCompanyId)
        .single();
      if (company) {
        setCompanySubdomain(company.subdomain);
      }
    } catch (error) {
      console.error("Error fetching subdomain:", error);
    }
  };

  const fetchUsers = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from("company_users")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      logError(error, "CompanyUsers - Fetch Users");
      const errorMessage = handleError(error, "Erro ao carregar usuários");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      toast.error("Erro: Empresa não encontrada");
      return;
    }

    if (!formData.username || (!editingUser && !formData.password)) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // Verificar se é gerente (company_user)
      if (currentCompanyUser && isGerente) {
        const passwordHash = editingUser && !formData.password 
          ? null 
          : await hashPassword(formData.password || "");
        
        if (editingUser) {
          // Atualizar via RPC
          const { error } = await supabase.rpc('gerente_update_company_user', {
            p_company_user_id: currentCompanyUser.id,
            p_target_user_id: editingUser.id,
            p_username: formData.username,
            p_password_hash: passwordHash,
            p_role: formData.role,
            p_is_active: null
          });
          
          if (error) throw error;
          toast.success("Usuário atualizado com sucesso");
        } else {
          // Criar via RPC
          const { data, error } = await supabase.rpc('gerente_create_company_user', {
            p_company_user_id: currentCompanyUser.id,
            p_username: formData.username,
            p_password_hash: passwordHash!,
            p_role: formData.role,
            p_company_id: selectedCompanyId
          });
          
          if (error) throw error;
          toast.success("Usuário criado com sucesso");
        }
      } else if (authUser) {
        // Owner/Admin ou Super Admin (usa operações diretas do Supabase)
        if (editingUser) {
          // Atualizar usuário existente
          const updateData: any = {
            username: formData.username,
            role: formData.role,
          };

          // Se forneceu nova senha, atualizar
          if (formData.password) {
            const passwordHash = await hashPassword(formData.password);
            updateData.password_hash = passwordHash;
          }

          const { error } = await supabase
            .from("company_users")
            .update(updateData)
            .eq("id", editingUser.id)
            .eq("company_id", selectedCompanyId);

          if (error) throw error;
          toast.success("Usuário atualizado com sucesso");
        } else {
          // Criar novo usuário
          const passwordHash = await hashPassword(formData.password);

          const { error } = await supabase
            .from("company_users")
            .insert({
              company_id: selectedCompanyId,
              username: formData.username,
              password_hash: passwordHash,
              role: formData.role,
              created_by: authUser.id,
            });

          if (error) throw error;
          toast.success("Usuário criado com sucesso");
        }
      } else {
        toast.error("Erro: Usuário não autenticado");
        return;
      }

      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      logError(error, "CompanyUsers - Save User");
      const errorMessage = handleError(error, "Erro ao salvar usuário");
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      // Verificar se é gerente (company_user)
      if (currentCompanyUser && isGerente) {
        // Deletar via RPC
        const { error } = await supabase.rpc('gerente_delete_company_user', {
          p_company_user_id: currentCompanyUser.id,
          p_target_user_id: userId
        });
        
        if (error) throw error;
        toast.success("Usuário excluído com sucesso");
      } else {
        // Owner/Admin ou Super Admin (usa operação direta do Supabase)
        const { error } = await supabase
          .from("company_users")
          .delete()
          .eq("id", userId)
          .eq("company_id", selectedCompanyId);

        if (error) throw error;
        toast.success("Usuário excluído com sucesso");
      }
      
      fetchUsers();
    } catch (error: any) {
      logError(error, "CompanyUsers - Delete User");
      const errorMessage = handleError(error, "Erro ao excluir usuário");
      toast.error(errorMessage);
    }
  };

  const handleEdit = (user: CompanyUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      role: "tecnico",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    );
  }

  // Verificar se pode gerenciar usuários
  if (!canManageUsers) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Acesso restrito. Apenas proprietários, administradores e gerentes podem gerenciar usuários.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Usuários da Empresa</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gerencie os usuários que podem acessar o sistema
              </p>
            </div>
            {isSuperAdmin && companies.length > 0 && (
              <div className="w-full sm:w-auto">
                <Label htmlFor="company-select" className="mb-2 block">Selecionar Empresa</Label>
                <Select
                  value={selectedCompanyId || ""}
                  onValueChange={(value) => setSelectedCompanyId(value)}
                >
                  <SelectTrigger id="company-select" className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} {company.subdomain && `(${company.subdomain})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Editar Usuário" : "Novo Usuário"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Atualize as informações do usuário. Deixe a senha em branco para manter a atual."
                    : "Crie um novo usuário para acessar o sistema com username e senha."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="nomeusuario"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required={!editingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Usuário *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "gerente" | "tecnico") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Gerente: acesso completo e relatórios financeiros. Técnico: acesso limitado.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUser ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {companySubdomain && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Subdomain da Empresa:</p>
                <p className="text-lg font-bold">{companySubdomain}.mofleet.com</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Os usuários devem fazer login em: <strong>{companySubdomain}.mofleet.com</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário cadastrado. Clique em "Adicionar Usuário" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "gerente" ? "default" : "secondary"}>
                          {user.role === "gerente" ? "Gerente" : "Técnico"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CompanyUsers;

