# Configurar Envio de Email com Credenciais

Este guia explica como configurar o envio automático de email com credenciais de acesso após a confirmação do email.

## 📋 O Que Foi Implementado

1. ✅ **Edge Function atualizada** - Suporta tipo "credentials"
2. ✅ **Função no banco** - `send_credentials_email()` para chamar a Edge Function
3. ✅ **Trigger atualizado** - `handle_new_user()` envia email automaticamente
4. ✅ **EmailService atualizado** - Método `sendCredentialsEmail()` no frontend

## 🔧 Configuração Necessária

### Passo 1: Habilitar Extensão pg_net (Opcional mas Recomendado)

A extensão `pg_net` permite que o banco de dados faça requisições HTTP para a Edge Function.

1. Acesse o **Supabase Dashboard**
2. Vá em **Database** > **Extensions**
3. Procure por `pg_net` e clique em **Enable**

**Nota:** Se `pg_net` não estiver disponível, você pode usar webhooks (veja Passo 3).

### Passo 2: Configurar Variáveis de Ambiente no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Project Settings** > **Edge Functions**
3. Adicione as seguintes variáveis:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@seudominio.com
SUPABASE_URL=https://seu-projeto-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

**Para encontrar essas informações:**
- `SUPABASE_URL`: Vá em **Project Settings** > **API** > **Project URL**
- `SUPABASE_SERVICE_ROLE_KEY`: Vá em **Project Settings** > **API** > **service_role key** (mantenha secreto!)

**Para obter a API Key do Resend:**
1. Acesse [resend.com](https://resend.com)
2. Vá em **API Keys**
3. Clique em **Create API Key**
4. Copie a chave gerada

### Passo 3: Configurar Webhook (Recomendado)

Como não podemos configurar variáveis de ambiente no banco de dados do Supabase sem permissões especiais, a melhor abordagem é usar **webhooks**.

**Não é necessário configurar variáveis no banco de dados.** O webhook será responsável por enviar o email.

### Passo 3: Configurar Webhook (Método Principal)

A forma mais confiável de enviar emails é através de webhooks do Supabase:

1. No **Supabase Dashboard**, vá em **Database** > **Webhooks**
2. Clique em **Create Webhook**
3. Configure:
   - **Name**: `send-credentials-email`
   - **Table**: `company_setup_credentials`
   - **Events**: `INSERT`
   - **HTTP Request**:
     - **URL**: `https://seu-projeto-ref.supabase.co/functions/v1/send-email`
       - Substitua `seu-projeto-ref` pelo seu project reference
     - **Method**: `POST`
     - **Headers**:
       ```
       Content-Type: application/json
       Authorization: Bearer sua-anon-key
       ```
     - **Body** (JSON):
       ```json
       {
         "type": "credentials",
         "userId": "{{record.user_id}}",
         "subdomain": "{{record.subdomain}}",
         "adminUsername": "{{record.admin_username}}",
         "adminPassword": "{{record.admin_password}}"
       }
       ```
       
       **Nota:** A Edge Function buscará automaticamente o email e company_name usando o `userId` através da função `get_credentials_with_email()` criada na migration.

### Passo 4: Deploy da Edge Function

1. Certifique-se de ter o Supabase CLI instalado:
```bash
npm install -g supabase
```

2. Faça login:
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

### Passo 5: Criar Função Helper para Webhook

Para facilitar o webhook acessar o email, crie esta função:

```sql
-- Função para obter dados completos das credenciais incluindo email
CREATE OR REPLACE FUNCTION public.get_credentials_with_email(p_user_id UUID)
RETURNS TABLE (
  email TEXT,
  company_name TEXT,
  subdomain TEXT,
  admin_username TEXT,
  admin_password TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.email,
    c.name,
    csc.subdomain,
    csc.admin_username,
    csc.admin_password
  FROM public.company_setup_credentials csc
  JOIN auth.users au ON au.id = csc.user_id
  LEFT JOIN public.user_profiles up ON up.user_id = csc.user_id
  LEFT JOIN public.companies c ON c.id = up.company_id
  WHERE csc.user_id = p_user_id;
END;
$$;
```

**Nota:** Webhooks do Supabase funcionam melhor com tabelas diretas. A melhor abordagem é fazer o webhook chamar a Edge Function com os dados da tabela `company_setup_credentials` e a Edge Function buscar o email do `auth.users`.

### Passo 6: Aplicar a Migration

Execute a migration no SQL Editor do Supabase:

```sql
-- Execute o conteúdo do arquivo:
-- supabase/migrations/20250116000010_send_credentials_email.sql
```

Ou via CLI:
```bash
supabase db push
```

## 🔄 Como o Webhook Funciona

O webhook será acionado quando um novo registro for inserido em `company_setup_credentials`. No entanto, a tabela não tem o email diretamente. 

**Solução:** A Edge Function foi atualizada para aceitar `userId` e buscar automaticamente o email e company_name do banco. Configure o webhook para enviar:

```json
{
  "type": "credentials",
  "userId": "{{record.user_id}}",
  "subdomain": "{{record.subdomain}}",
  "adminUsername": "{{record.admin_username}}",
  "adminPassword": "{{record.admin_password}}"
}
```

A Edge Function buscará automaticamente o email e company_name usando a função `get_credentials_with_email()`.

## 🧪 Testar

1. **Crie um novo usuário** no sistema
2. **Confirme o email** clicando no link recebido
3. **Verifique se o email com credenciais foi enviado**
4. **Confirme que as credenciais estão corretas** no email

## 📧 Template do Email

O email enviado contém:
- ✅ Subdomain da empresa
- ✅ Username do administrador
- ✅ Senha do administrador
- ✅ Instruções de próximos passos
- ✅ Link direto para acessar a conta

## 🔍 Troubleshooting

### Email não está sendo enviado?

1. **Verifique se pg_net está habilitado:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

2. **Verifique os logs da Edge Function:**
   - Vá em **Edge Functions** > **send-email** > **Logs**
   - Procure por erros

3. **Verifique as variáveis de ambiente:**
   - Confirme que `RESEND_API_KEY` está configurada
   - Confirme que `RESEND_FROM_EMAIL` está configurada

4. **Teste a Edge Function manualmente:**
   ```bash
   curl -X POST https://seu-projeto.supabase.co/functions/v1/send-email \
     -H "Authorization: Bearer sua-anon-key" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "credentials",
       "email": "teste@example.com",
       "companyName": "Empresa Teste",
       "subdomain": "empresa-teste",
       "adminUsername": "admin",
       "adminPassword": "senha123"
     }'
   ```

### Erro "pg_net não está disponível"?

- Opção 1: Habilite a extensão `pg_net` no Supabase Dashboard
- Opção 2: Use webhooks (veja Passo 5 acima)
- Opção 3: As credenciais ainda estarão disponíveis na página `/welcome`

### Email vai para spam?

1. **Verifique seu domínio no Resend:**
   - Vá em **Domains** no Resend Dashboard
   - Configure SPF e DKIM records

2. **Use um domínio verificado:**
   - Não use `onboarding@resend.dev` em produção
   - Configure um domínio próprio

## 📝 Notas Importantes

1. **Segurança**: As credenciais são enviadas por email. Certifique-se de usar HTTPS e um provedor de email confiável.

2. **Fallback**: Se o email não puder ser enviado, as credenciais ainda estarão disponíveis na página `/welcome` após o login.

3. **Rate Limits**: O Resend tem limites de envio. Verifique seu plano.

4. **Logs**: Sempre verifique os logs se houver problemas.

## ✅ Checklist de Configuração

- [ ] Extensão `pg_net` habilitada (ou webhook configurado)
- [ ] Variáveis de ambiente do Resend configuradas
- [ ] Variáveis do banco configuradas (se usar pg_net)
- [ ] Edge Function deployada
- [ ] Migration aplicada
- [ ] Teste de envio de email realizado
- [ ] Domínio verificado no Resend (para produção)

---

**Data de implementação:** 2025-01-16  
**Migration:** `20250116000010_send_credentials_email.sql`

