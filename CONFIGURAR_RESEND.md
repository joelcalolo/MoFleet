# Configuração do Resend para Envio de Emails (Opcional)

Este guia explica como configurar o Resend para enviar emails customizados no sistema.

**Nota**: O sistema usa Supabase Auth por padrão, que já envia emails automaticamente. O Resend é opcional e pode ser usado para emails customizados ou quando você quiser mais controle sobre os templates de email.

**Para configurar SMTP customizado no Supabase**, consulte o arquivo `CONFIGURAR_SMTP_SUPABASE.md`.

## 📋 Pré-requisitos

1. Conta no [Resend](https://resend.com)
2. API Key do Resend
3. Domínio verificado no Resend (ou usar o domínio de teste)

## 🔧 Passo 1: Obter API Key do Resend

1. Acesse [resend.com](https://resend.com) e faça login
2. Vá em **API Keys** no menu lateral
3. Clique em **Create API Key**
4. Dê um nome (ex: "RentaCar Production")
5. Copie a API Key gerada (ela só aparece uma vez!)

## 🔧 Passo 2: Configurar Variáveis de Ambiente

### No Supabase (para Edge Functions)

1. Acesse o Dashboard do Supabase
2. Vá em **Project Settings** > **Edge Functions**
3. Adicione as seguintes variáveis de ambiente:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@seudominio.com
```

**Nota**: Se você não tem um domínio verificado, use `onboarding@resend.dev` temporariamente.

### No Frontend (opcional - se usar diretamente)

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
VITE_RESEND_FROM_EMAIL=noreply@seudominio.com
```

## 🔧 Passo 3: Deploy da Edge Function

1. Certifique-se de ter o Supabase CLI instalado:
```bash
npm install -g supabase
```

2. Faça login no Supabase:
```bash
supabase login
```

3. Link seu projeto:
```bash
supabase link --project-ref seu-project-ref
```

4. Deploy da função:
```bash
supabase functions deploy send-email
```

## 🔧 Passo 4: Configurar Webhook no Supabase (Opcional)

Para interceptar automaticamente os eventos de autenticação e enviar emails via Resend:

1. No Supabase Dashboard, vá em **Database** > **Webhooks**
2. Crie um novo webhook:
   - **Name**: `auth-email-sender`
   - **Table**: `auth.users`
   - **Events**: `INSERT`, `UPDATE`
   - **HTTP Request**: 
     - **URL**: `https://seu-projeto.supabase.co/functions/v1/send-email`
     - **Method**: `POST`
     - **Headers**: 
       ```
       Authorization: Bearer SEU_ANON_KEY
       Content-Type: application/json
       ```

## 🔧 Passo 5: Usar no Código Frontend

### Opção A: Usar Edge Function (Recomendado)

```typescript
import { supabase } from "@/integrations/supabase/client";

// Ao criar conta
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
  },
});

if (!error && data.user) {
  // Chamar a edge function para enviar email customizado
  await supabase.functions.invoke("send-email", {
    body: {
      type: "confirmation",
      email: email,
      confirmationLink: `${window.location.origin}/auth/confirm?token=...`,
      companyName: companyName,
    },
  });
}
```

### Opção B: Usar Diretamente (Client-side)

```typescript
import { sendConfirmationEmail } from "@/lib/resend";

// Ao criar conta
await sendConfirmationEmail(
  email,
  confirmationLink,
  companyName
);
```

## 📧 Templates de Email

Os templates de email estão configurados em:
- `src/lib/resend.ts` - Para uso no frontend
- `supabase/functions/send-email/index.ts` - Para uso na edge function

Você pode personalizar os templates HTML conforme necessário.

## 🧪 Testar

1. Crie uma nova conta no sistema
2. Verifique se o email de confirmação foi recebido
3. Teste a redefinição de senha
4. Verifique os logs no Resend Dashboard

## 🔍 Verificar Logs

- **Resend Dashboard**: Vá em **Emails** para ver todos os emails enviados
- **Supabase Logs**: Vá em **Edge Functions** > **Logs** para ver logs da função

## ⚠️ Notas Importantes

1. **Domínio Verificado**: Para produção, você precisa verificar um domínio no Resend
2. **Rate Limits**: O plano gratuito do Resend tem limites de envio
3. **Segurança**: Nunca exponha sua API Key no código frontend. Use sempre Edge Functions para produção
4. **Fallback**: O Supabase Auth continuará funcionando normalmente se o Resend falhar

## 🚀 Produção

Para produção:
1. Verifique seu domínio no Resend
2. Configure SPF e DKIM records no DNS
3. Use um email profissional (ex: `noreply@seudominio.com`)
4. Configure monitoramento de bounces e reclamações

## 📚 Recursos

- [Documentação do Resend](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend API Reference](https://resend.com/docs/api-reference)

