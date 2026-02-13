import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Settings as SettingsIcon, Upload, Trash2 } from "lucide-react";
import { handleError, logError } from "@/lib/errorHandler";

const BUCKET_LOGO = "company-logos";
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_LOGO_DIMENSION = 512;
const LOGO_JPEG_QUALITY = 0.82;
/** PNG/WebP preservam transparência; JPEG não. */
const PRESERVE_TRANSPARENCY_TYPES = ["image/png", "image/webp"];

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  logo_url?: string;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserRole(profile?.role ?? null);
    })();
  }, []);

  const fetchCompany = async () => {
    try {
      const { data: companyData, error } = await supabase
        .from("companies")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (companyData) {
        setCompany(companyData);
        setFormData({
          name: companyData.name || "",
          email: companyData.email || "",
          phone: companyData.phone || "",
          address: companyData.address || "",
          tax_id: companyData.tax_id || "",
        });
      } else {
        setCompany(null);
        setFormData({ name: "", email: "", phone: "", address: "", tax_id: "" });
      }
    } catch (error: any) {
      logError(error, "Settings - Fetch Company");
      const errorMessage = handleError(error, "Erro ao carregar dados da organização");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (company) {
        const { error } = await supabase
          .from("companies")
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            tax_id: formData.tax_id || null,
            logo_url: company.logo_url ?? undefined,
          })
          .eq("id", company.id);

        if (error) throw error;
        toast.success("Dados da organização atualizados com sucesso");
      } else {
        const { data: newCompany, error } = await supabase
          .from("companies")
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            tax_id: formData.tax_id || null,
          })
          .select("id, name, email, phone, address, tax_id")
          .single();

        if (error) throw error;
        setCompany(newCompany);
        toast.success("Dados da organização guardados com sucesso");
      }
      fetchCompany();
    } catch (error: any) {
      logError(error, "Settings - Update Company");
      const errorMessage = handleError(error, "Erro ao guardar dados da organização");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error("Email não encontrado");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) throw error;

      toast.success("Email de redefinição de senha enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      logError(error, "Settings - Reset Password");
      const errorMessage = handleError(error, "Erro ao enviar email de redefinição");
      toast.error(errorMessage);
    }
  };

  const canManageLogo = userRole === "admin" || userRole === "owner";

  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      const usePng = PRESERVE_TRANSPARENCY_TYPES.includes(file.type);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const needsResize = w > MAX_LOGO_DIMENSION || h > MAX_LOGO_DIMENSION;
        if (usePng && !needsResize) {
          resolve(file.slice(0, file.size, file.type));
          return;
        }
        let targetW = w;
        let targetH = h;
        if (needsResize) {
          if (w >= h) {
            targetW = MAX_LOGO_DIMENSION;
            targetH = Math.round((h * MAX_LOGO_DIMENSION) / w);
          } else {
            targetH = MAX_LOGO_DIMENSION;
            targetW = Math.round((w * MAX_LOGO_DIMENSION) / h);
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        if (usePng) {
          ctx.clearRect(0, 0, targetW, targetH);
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        if (usePng) {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
            "image/png",
            1
          );
        } else {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
            "image/jpeg",
            LOGO_JPEG_QUALITY
          );
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !company) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Ficheiro demasiado grande. Máximo 3 MB.");
      return;
    }
    setUploadingLogo(true);
    try {
      const blob = await optimizeImage(file);
      const ext =
        blob.type === "image/png"
          ? "png"
          : blob.type === "image/webp"
            ? "webp"
            : "jpg";
      const path = `${company.id}/logo.${ext}`;

      const doUpload = async () => {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_LOGO)
          .upload(path, blob, { contentType: blob.type, upsert: true });
        if (uploadError) throw uploadError;
      };

      try {
        await doUpload();
      } catch (firstErr: any) {
        const isBucketNotFound =
          firstErr?.message?.includes("Bucket not found") ||
          (typeof firstErr?.message === "string" && firstErr.message.toLowerCase().includes("bucket"));
        if (isBucketNotFound) {
          const { error: createErr } = await supabase.storage.createBucket(BUCKET_LOGO, {
            public: true,
            fileSizeLimit: "3MB",
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          });
          if (!createErr) {
            await doUpload();
          } else {
            toast.error(
              "Crie o bucket no Supabase: Storage > New bucket > nome «company-logos», marque como público."
            );
            logError(firstErr, "Settings - Logo Upload (bucket missing)");
            return;
          }
        } else {
          throw firstErr;
        }
      }

      const { data: urlData } = supabase.storage.from(BUCKET_LOGO).getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: publicUrl })
        .eq("id", company.id);
      if (updateError) throw updateError;
      setCompany((prev) => (prev ? { ...prev, logo_url: publicUrl } : null));
      toast.success("Logo atualizado com sucesso");
    } catch (err: any) {
      logError(err, "Settings - Logo Upload");
      toast.error(handleError(err, "Erro ao carregar o logo"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!company?.logo_url) return;
    setUploadingLogo(true);
    try {
      await supabase.storage.from(BUCKET_LOGO).remove([
        `${company.id}/logo.jpg`,
        `${company.id}/logo.png`,
      ]);
      // ignore storage errors (e.g. file already missing)
    } catch {
      // continue to clear logo_url in DB
    }
    try {
      const { error } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", company.id);
      if (error) throw error;
      setCompany((prev) => (prev ? { ...prev, logo_url: undefined } : null));
      toast.success("Logo removido");
    } catch (err: any) {
      logError(err, "Settings - Remove Logo");
      toast.error(handleError(err, "Erro ao remover o logo"));
    } finally {
      setUploadingLogo(false);
    }
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

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie as informações da sua empresa</p>
        </div>

        <div className="space-y-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Atualize as informações da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id">NIF/Número de Identificação Fiscal</Label>
                    <Input
                      id="tax_id"
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={saving}
                  />
                </div>

                {canManageLogo && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label>Logo da empresa</Label>
                    <div className="flex flex-wrap items-center gap-4">
                      {company?.logo_url && (
                        <div className="flex items-center gap-2">
                          <img
                            src={company.logo_url}
                            alt="Logo"
                            className="h-16 w-auto max-w-[200px] object-contain rounded border bg-transparent"
                            style={{ background: "transparent" }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                            disabled={uploadingLogo}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo || !company}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLogo || !company}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {uploadingLogo ? "A carregar..." : "Carregar logo"}
                        </Button>
                      </div>
                    </div>
                    {!company && (
                      <p className="text-sm text-muted-foreground">
                        Guarde os dados da empresa primeiro para poder carregar o logo.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie sua senha e segurança da conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Redefinir Senha</h3>
                    <p className="text-sm text-muted-foreground">
                      Receba um email para redefinir sua senha
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleResetPassword} className="w-full sm:w-auto">
                    Redefinir Senha
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

