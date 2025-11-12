# Configurar SMTP Customizado no Supabase com Resend

Este guia explica como configurar SMTP customizado no Supabase para usar o Resend como provedor de email, mantendo toda a funcionalidade do Supabase Auth.

## 🎯 Por que Configurar SMTP Customizado?

- **Mantém Supabase Auth**: Toda a funcionalidade de autenticação continua funcionando
- **Emails Personalizados**: Use templates customizados do Resend
- **Melhor Deliverability**: Resend tem excelente taxa de entrega
- **Analytics**: Veja estatísticas de emails no dashboard do Resend
- **Domínio Próprio**: Use seu próprio domínio para emails

## 📋 Pré-requisitos

1. Conta no [Resend](https://resend.com)
2. API Key do Resend
3. Domínio verificado no Resend (recomendado para produção)

## 🔧 Passo 1: Obter Credenciais SMTP do Resend

O Resend não fornece SMTP tradicional, mas você pode usar a API do Resend através de uma solução alternativa ou usar outro provedor SMTP compatível.

### Opção A: Usar Resend via API (Recomendado)

O Resend funciona melhor via API. Para usar SMTP customizado no Supabase, você tem duas opções:

1. **Usar outro provedor SMTP** (SendGrid, Mailgun, etc.) que seja compatível
2. **Usar webhooks do Supabase** para interceptar eventos e enviar via Resend API

### Opção B: Usar SendGrid ou Mailgun (SMTP Compatível)

Se você precisa de SMTP tradicional, considere:
- **SendGrid**: Oferece SMTP e API
- **Mailgun**: Oferece SMTP e API
- **Amazon SES**: Oferece SMTP

## 🔧 Passo 2: Configurar SMTP no Supabase Dashboard

### Via Dashboard do Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Project Settings** > **Auth** > **SMTP Settings**
3. Ative **Custom SMTP**
4. Preencha as configurações:

#### Para SendGrid:
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Sua SendGrid API Key]
Sender Email: noreply@seudominio.com
Sender Name: RentaCar
```

#### Para Mailgun:
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Seu Mailgun SMTP Username]
SMTP Password: [Seu Mailgun SMTP Password]
Sender Email: noreply@seudominio.com
Sender Name: RentaCar
```

#### Para Amazon SES:
```
SMTP Host: email-smtp.[região].amazonaws.com
SMTP Port: 587
SMTP User: [Seu AWS Access Key ID]
SMTP Password: [Seu AWS Secret Access Key]
Sender Email: noreply@seudominio.com
Sender Name: RentaCar
```

5. Clique em **Save**

## 🔧 Passo 3: Usar Resend via Webhooks (Alternativa)

Se você quer usar especificamente o Resend, pode configurar webhooks para interceptar eventos de autenticação:

### 3.1 Criar Edge Function para Webhook

Já temos a função `send-email` criada. Agora vamos configurar um webhook.

### 3.2 Configurar Webhook no Supabase

1. No Supabase Dashboard, vá em **Database** > **Webhooks**
2. Crie um novo webhook:
   - **Name**: `auth-email-webhook`
   - **Table**: `auth.users`
   - **Events**: `INSERT` (quando novo usuário é criado)
   - **HTTP Request**:
     - **URL**: `https://seu-projeto.supabase.co/functions/v1/send-email`
     - **Method**: `POST`
     - **Headers**:
       ```
       Authorization: Bearer [SEU_ANON_KEY]
       Content-Type: application/json
       ```

### 3.3 Atualizar Edge Function para Processar Webhooks

A função `send-email` já está preparada, mas podemos melhorá-la para processar webhooks do Supabase.

## 🔧 Passo 4: Configurar Templates de Email no Supabase

1. No Supabase Dashboard, vá em **Auth** > **Email Templates**
2. Você pode customizar os templates HTML para:
   - **Confirm signup**: Email de confirmação
   - **Magic Link**: Link mágico
   - **Change Email Address**: Mudança de email
   - **Reset Password**: Redefinição de senha
   - **Invite user**: Convite de usuário

### Exemplo de Template Customizado (Confirm Signup):

```html
<h2>Bem-vindo ao RentaCar!</h2>
<p>Olá,</p>
<p>Obrigado por criar sua conta!</p>
<p>Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Se você não criou esta conta, pode ignorar este email.</p>
```

## 🔧 Passo 5: Testar Configuração

1. **Teste de Confirmação de Email**:
   - Crie uma nova conta de teste
   - Verifique se o email foi recebido
   - Verifique se o link funciona

2. **Teste de Redefinição de Senha**:
   - Solicite redefinição de senha
   - Verifique se o email foi recebido
   - Verifique se o link funciona

3. **Verificar Logs**:
   - No Supabase: **Logs** > **Auth Logs**
   - No Resend/SendGrid: Dashboard de emails enviados

## 🔧 Passo 6: Usar Resend Especificamente (Solução Híbrida)

Se você quer usar Resend especificamente, a melhor abordagem é:

1. **Manter SMTP padrão do Supabase** para funcionalidade básica
2. **Usar Edge Functions + Resend** para emails customizados
3. **Interceptar eventos** via webhooks quando necessário

### Exemplo: Enviar Email Customizado Após Signup

```typescript
// No código frontend, após signup bem-sucedido
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
  },
});

if (!error && data.user) {
  // Enviar email customizado via Resend (opcional)
  try {
    await supabase.functions.invoke("send-email", {
      body: {
        type: "confirmation",
        email: email,
        confirmationLink: `${window.location.origin}/auth/confirm?token=...`,
        companyName: companyName,
      },
    });
  } catch (err) {
    // Não bloquear o fluxo se o email customizado falhar
    console.error("Erro ao enviar email customizado:", err);
  }
}
```

## ⚙️ Configurações Avançadas

### Rate Limiting

Configure rate limiting no Supabase:
- **Auth** > **Rate Limits**
- Ajuste limites de emails por hora/dia

### Domínio Verificado

Para produção, verifique seu domínio:
1. No Resend/SendGrid, adicione seu domínio
2. Configure registros DNS (SPF, DKIM, DMARC)
3. Use o domínio verificado no `Sender Email`

### Monitoramento

- **Supabase Logs**: Monitore erros de envio
- **Resend Dashboard**: Veja estatísticas de entrega
- **SendGrid Activity**: Veja status de cada email

## 🚨 Troubleshooting

### Emails não estão sendo enviados

1. Verifique se SMTP está ativado no Supabase
2. Verifique credenciais SMTP
3. Verifique logs do Supabase
4. Teste conexão SMTP manualmente

### Emails vão para spam

1. Verifique SPF/DKIM records
2. Use domínio verificado
3. Evite palavras spam no assunto
4. Configure DMARC

### Erro de autenticação SMTP

1. Verifique usuário e senha
2. Verifique se porta está correta (587 para TLS)
3. Verifique se firewall não está bloqueando
4. Teste com ferramenta externa (Mail Tester)

## 📚 Recursos

- [Supabase SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)
- [Mailgun SMTP](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)

## ✅ Checklist de Configuração

- [ ] Conta criada no provedor SMTP (Resend/SendGrid/Mailgun)
- [ ] API Key ou credenciais SMTP obtidas
- [ ] Domínio verificado (para produção)
- [ ] SMTP configurado no Supabase Dashboard
- [ ] Templates de email customizados (opcional)
- [ ] Testes realizados (signup e password reset)
- [ ] Logs verificados
- [ ] Rate limits configurados
- [ ] Monitoramento configurado

---

**Nota**: O Resend funciona melhor via API. Se você precisa especificamente de SMTP, considere SendGrid ou Mailgun que oferecem ambos SMTP e API.

