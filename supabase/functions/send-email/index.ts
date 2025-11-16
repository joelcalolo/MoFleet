// Supabase Edge Function para enviar emails via Resend
// Esta função é chamada quando eventos de autenticação ocorrem

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

// Inicializar cliente Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  try {
    const { type, email, confirmationLink, resetLink, companyName, subdomain, adminUsername, adminPassword, userId } = await req.json();

    // Validação de email (exceto para tipo credentials que pode buscar do userId)
    if (type !== "credentials" && !email) {
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
    } else if (type === "credentials") {
      // Se userId foi fornecido, buscar email e company_name do banco
      let userEmail = email;
      let userCompanyName = companyName;
      
      if (userId && !email) {
        try {
          // Buscar dados do usuário usando a função helper
          const { data: credentialsData, error: fetchError } = await supabase
            .rpc('get_credentials_with_email', { p_user_id: userId });
          
          if (!fetchError && credentialsData && credentialsData.length > 0) {
            userEmail = credentialsData[0].email;
            userCompanyName = credentialsData[0].company_name || companyName;
            // Se subdomain, adminUsername ou adminPassword não foram fornecidos, usar do banco
            if (!subdomain) subdomain = credentialsData[0].subdomain;
            if (!adminUsername) adminUsername = credentialsData[0].admin_username;
            if (!adminPassword) adminPassword = credentialsData[0].admin_password;
          }
        } catch (error) {
          console.error("Erro ao buscar credenciais do banco:", error);
          // Continuar com os dados fornecidos diretamente
        }
      }
      
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório para envio de credenciais" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      const credentialsHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Suas Credenciais de Acesso - MoFleet</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #004C70 0%, #0066A0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">🎉 Conta Criada com Sucesso!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Olá,</p>
              <p>Sua empresa <strong>${userCompanyName || 'foi configurada'}</strong> está pronta para uso!</p>
              
              <div style="background: white; border: 2px solid #004C70; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #004C70; margin-top: 0;">📍 Seu Subdomain</h2>
                <p style="font-size: 18px; font-weight: bold; color: #0066A0; word-break: break-all;">
                  https://${subdomain}.mofleet.com
                </p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                  Acesse este endereço para fazer login na sua conta da empresa
                </p>
              </div>

              <div style="background: white; border: 2px solid #004C70; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #004C70; margin-top: 0;">🔑 Credenciais do Administrador</h2>
                <div style="margin: 15px 0;">
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">Username:</p>
                  <p style="margin: 5px 0; font-size: 18px; font-weight: bold; font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 4px;">
                    ${adminUsername}
                  </p>
                </div>
                <div style="margin: 15px 0;">
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">Senha:</p>
                  <p style="margin: 5px 0; font-size: 18px; font-weight: bold; font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 4px;">
                    ${adminPassword}
                  </p>
                </div>
                <p style="font-size: 12px; color: #d32f2f; margin-top: 15px; padding: 10px; background: #ffebee; border-radius: 4px;">
                  ⚠️ <strong>Importante:</strong> Guarde estas credenciais com segurança! A senha não será exibida novamente.
                </p>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #856404;">📝 Próximos Passos:</h3>
                <ol style="margin: 10px 0; padding-left: 20px; color: #856404;">
                  <li>Acesse seu subdomain: <strong>https://${subdomain}.mofleet.com</strong></li>
                  <li>Faça login com as credenciais acima</li>
                  <li>Altere a senha do administrador (recomendado)</li>
                  <li>Crie outros usuários conforme necessário</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://${subdomain}.mofleet.com" 
                   style="background: #004C70; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Acessar Minha Conta
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                Se você não criou esta conta, entre em contato conosco imediatamente.
              </p>
            </div>
          </body>
        </html>
      `;

      emailPayload = {
        to: userEmail,
        subject: "Suas Credenciais de Acesso - MoFleet",
        html: credentialsHtml,
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

