// Supabase Edge Function para enviar emails via Resend
// Esta função é chamada quando eventos de autenticação ocorrem

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  try {
    const { type, email, confirmationLink, resetLink, companyName } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let emailPayload: EmailPayload;

    if (type === "confirmation") {
      const confirmationHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirme sua conta</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Bem-vindo ao RentaCar!</h1>
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

      emailPayload = {
        to: email,
        subject: "Confirme sua conta - RentaCar",
        html: confirmationHtml,
      };
    } else if (type === "password_reset") {
      const resetHtml = `
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

      emailPayload = {
        to: email,
        subject: "Redefinir senha - RentaCar",
        html: resetHtml,
      };
    } else {
      return new Response(
        JSON.stringify({ error: "Tipo de email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Enviar email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: emailPayload.to,
        subject: emailPayload.subject,
        html: emailPayload.html,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.json();
      throw new Error(`Erro ao enviar email: ${JSON.stringify(error)}`);
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na função send-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

