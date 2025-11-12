import { Resend } from "resend";

// Inicializar Resend com a API key
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envia um email usando Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const fromEmail = options.from || import.meta.env.VITE_RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Erro ao enviar email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw error;
  }
}

/**
 * Template de email de confirmação de conta
 */
export function getConfirmationEmailTemplate(
  email: string,
  confirmationLink: string,
  companyName?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme sua conta</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Bem-vindo ao MoFleet!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Olá,</p>
          <p>Obrigado por criar sua conta${companyName ? ` para ${companyName}` : ""}!</p>
          <p>Para ativar sua conta, por favor confirme seu endereço de email clicando no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Confirmar Email
            </a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #667eea;">${confirmationLink}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Se você não criou esta conta, pode ignorar este email.
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Template de email de redefinição de senha
 */
export function getPasswordResetEmailTemplate(
  email: string,
  resetLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir senha</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Redefinir Senha</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Redefinir Senha
            </a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #f5576c;">${resetLink}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Este link expira em 1 hora. Se você não solicitou esta redefinição, pode ignorar este email.
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Envia email de confirmação de conta
 */
export async function sendConfirmationEmail(
  email: string,
  confirmationLink: string,
  companyName?: string
) {
  return sendEmail({
    to: email,
    subject: "Confirme sua conta - MoFleet",
    html: getConfirmationEmailTemplate(email, confirmationLink, companyName),
  });
}

/**
 * Envia email de redefinição de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
) {
  return sendEmail({
    to: email,
    subject: "Redefinir senha - MoFleet",
    html: getPasswordResetEmailTemplate(email, resetLink),
  });
}

