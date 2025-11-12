# Configurar Templates de Email no Supabase

Este guia explica como configurar os templates de email "Confirm Sign up" e "Reset password" no Supabase Dashboard.

## 🎯 Objetivo

Configurar os templates de email do Supabase para usar templates personalizados para:
- **Confirm Sign up**: Email de confirmação de cadastro
- **Reset password**: Email de redefinição de senha

## 📋 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione o projeto desejado

### 2. Navegar até Email Templates

1. No menu lateral, vá em **Authentication** (ou **Auth**)
2. Clique em **Email Templates** (ou **Templates**)
3. Você verá uma lista de templates disponíveis:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password
   - Invite user

### 3. Configurar Template "Confirm Sign up"

1. Clique no template **Confirm signup**
2. Você verá dois campos:
   - **Subject**: Assunto do email
   - **Body**: Corpo do email (HTML)

#### Exemplo de Template "Confirm Sign up":

**Subject:**
```
Confirme seu cadastro no MoFleet
```

**Body:**
```html
<h2>Bem-vindo ao MoFleet!</h2>
<p>Olá,</p>
<p>Obrigado por criar sua conta no MoFleet. Para completar seu cadastro, clique no link abaixo para confirmar seu endereço de email:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Confirmar Email</a></p>
<p>Ou copie e cole este link no seu navegador:</p>
<p style="word-break: break-all; color: #6B7280;">{{ .ConfirmationURL }}</p>
<p>Este link expira em 24 horas.</p>
<p>Se você não criou esta conta, pode ignorar este email com segurança.</p>
<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
<p style="color: #6B7280; font-size: 14px;">Equipe MoFleet</p>
```

### 4. Configurar Template "Reset Password"

1. Clique no template **Reset Password**
2. Configure o assunto e o corpo do email

#### Exemplo de Template "Reset Password":

**Subject:**
```
Redefinir sua senha - MoFleet
```

**Body:**
```html
<h2>Redefinição de Senha</h2>
<p>Olá,</p>
<p>Recebemos uma solicitação para redefinir a senha da sua conta no MoFleet.</p>
<p>Clique no link abaixo para criar uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Redefinir Senha</a></p>
<p>Ou copie e cole este link no seu navegador:</p>
<p style="word-break: break-all; color: #6B7280;">{{ .ConfirmationURL }}</p>
<p>Este link expira em 1 hora.</p>
<p><strong>Se você não solicitou a redefinição de senha, ignore este email.</strong> Sua senha permanecerá inalterada.</p>
<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
<p style="color: #6B7280; font-size: 14px;">Equipe MoFleet</p>
```

### 5. Variáveis Disponíveis nos Templates

O Supabase fornece as seguintes variáveis que podem ser usadas nos templates:

#### Para "Confirm Sign up":
- `{{ .ConfirmationURL }}` - URL de confirmação
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de confirmação (hash)
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL do site configurado

#### Para "Reset Password":
- `{{ .ConfirmationURL }}` - URL de redefinição de senha
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de redefinição (hash)
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL do site configurado
- `{{ .RedirectTo }}` - URL de redirecionamento após redefinição

### 6. Salvar as Alterações

1. Após configurar cada template, clique em **Save** (ou **Salvar**)
2. As alterações são aplicadas imediatamente
3. Novos emails usarão os templates configurados

## 🧪 Testar os Templates

### Teste de Confirmação de Cadastro:

1. Crie uma nova conta de teste no sistema
2. Verifique se o email foi recebido
3. Verifique se o assunto está correto
4. Verifique se o link de confirmação funciona
5. Verifique se o design está como esperado

### Teste de Redefinição de Senha:

1. Solicite redefinição de senha para uma conta existente
2. Verifique se o email foi recebido
3. Verifique se o assunto está correto
4. Verifique se o link de redefinição funciona
5. Verifique se o design está como esperado

## 📝 Dicas de Design

### Boas Práticas:

1. **Use HTML simples e compatível**: Evite CSS complexo que pode não funcionar em todos os clientes de email
2. **Inclua link alternativo**: Sempre forneça uma opção de copiar/colar o link
3. **Mensagem de segurança**: Inclua uma nota sobre ignorar o email se não foi solicitado
4. **Informações de expiração**: Informe quando o link expira
5. **Branding consistente**: Use cores e estilo consistentes com sua marca

### Cores Sugeridas (MoFleet):

- **Cor primária**: `#4F46E5` (Indigo)
- **Cor de texto**: `#111827` (Cinza escuro)
- **Cor de texto secundário**: `#6B7280` (Cinza médio)
- **Cor de borda**: `#E5E7EB` (Cinza claro)

## 🔍 Verificar Logs

Para verificar se os emails estão sendo enviados corretamente:

1. No Supabase Dashboard, vá em **Logs** > **Auth Logs**
2. Procure por eventos de:
   - `user_signup` - Para confirmação de cadastro
   - `password_reset` - Para redefinição de senha
3. Verifique se há erros nos logs

## ⚙️ Configurações Adicionais

### Configurar Site URL

1. Vá em **Project Settings** > **Auth** > **URL Configuration**
2. Configure:
   - **Site URL**: URL base do seu site (ex: `https://seu-dominio.com`)
   - **Redirect URLs**: URLs permitidas para redirecionamento

### Configurar SMTP (Opcional)

Se quiser usar SMTP customizado em vez do padrão do Supabase:

1. Vá em **Project Settings** > **Auth** > **SMTP Settings**
2. Ative **Custom SMTP**
3. Configure as credenciais do seu provedor SMTP
4. Consulte `CONFIGURAR_SMTP_SUPABASE.md` para mais detalhes

## ✅ Checklist

- [ ] Template "Confirm Sign up" configurado
- [ ] Template "Reset Password" configurado
- [ ] Assuntos dos emails configurados
- [ ] Corpos dos emails (HTML) configurados
- [ ] Teste de confirmação de cadastro realizado
- [ ] Teste de redefinição de senha realizado
- [ ] Links de confirmação/redefinição funcionando
- [ ] Design dos emails verificado
- [ ] Logs verificados para erros

## 🚨 Troubleshooting

### Emails não estão sendo enviados:

1. Verifique se os templates estão salvos corretamente
2. Verifique os logs do Supabase (Auth Logs)
3. Verifique se o SMTP está configurado (ou usando o padrão)
4. Verifique se há rate limiting ativo

### Links não funcionam:

1. Verifique se a `Site URL` está configurada corretamente
2. Verifique se as `Redirect URLs` incluem o domínio correto
3. Verifique se o link está usando `{{ .ConfirmationURL }}` corretamente

### Design não aparece corretamente:

1. Use HTML inline para estilos (não CSS externo)
2. Teste em diferentes clientes de email (Gmail, Outlook, etc.)
3. Evite CSS complexo ou JavaScript
4. Use tabelas para layout se necessário

## 📚 Recursos

- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-config)
- [HTML Email Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding/)

---

**Nota**: Os templates configurados no Supabase Dashboard são aplicados automaticamente a todos os emails de autenticação enviados pelo Supabase Auth. Não é necessário modificar o código da aplicação.

