import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço de email usando Supabase Edge Functions + Resend
 */
export class EmailService {
  /**
   * Envia email de confirmação de conta
   */
  static async sendConfirmationEmail(
    email: string,
    confirmationLink: string,
    companyName?: string
  ) {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "confirmation",
          email,
          confirmationLink,
          companyName,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao enviar email de confirmação:", error);
      throw error;
    }
  }

  /**
   * Envia email de redefinição de senha
   */
  static async sendPasswordResetEmail(email: string, resetLink: string) {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "password_reset",
          email,
          resetLink,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao enviar email de redefinição:", error);
      throw error;
    }
  }

  /**
   * Envia email com credenciais de acesso
   */
  static async sendCredentialsEmail(
    email: string,
    companyName: string,
    subdomain: string,
    adminUsername: string,
    adminPassword: string
  ) {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "credentials",
          email,
          companyName,
          subdomain,
          adminUsername,
          adminPassword,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao enviar email de credenciais:", error);
      throw error;
    }
  }
}

