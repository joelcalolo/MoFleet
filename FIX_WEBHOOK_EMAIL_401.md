# Corrigir Erro 401 no Webhook de Email

## Problema

O webhook está retornando erro 401 (não autorizado) e os placeholders não estão sendo substituídos:
```
POST | 401 | .../send-email?type=credentials&userId=%7B%7Brecord.user_id%7D%7D...
```

## Causas

1. **Autenticação incorreta**: O webhook está usando `anon_key` em vez de `service_role_key`
2. **Dados como query string**: Os dados estão sendo enviados como query string em vez de body JSON
3. **Placeholders não substituídos**: Os `{{record.xxx}}` não estão sendo processados

## Solução 1: Corrigir Configuração do Webhook

### Passo 1: Obter Service Role Key

1. Acesse o **Supabase Dashboard**
2. Vá em **Project Settings** > **API**
3. Copie a **service_role key** (não a anon key!)
   - ⚠️ **IMPORTANTE**: Mantenha esta chave secreta!
   - A service_role_key começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Passo 2: Deletar Webhook Antigo (se existir)

1. No **Supabase Dashboard**, vá em **Database** > **Webhooks**
2. Se existir um webhook `send-credentials-email`, **delete-o**
3. Isso garante que não há configurações antigas interferindo

### Passo 3: Criar Novo Webhook Corretamente

1. No **Supabase Dashboard**, vá em **Database** > **Webhooks**
2. Clique em **Create Webhook** (ou **New Webhook**)
3. Configure exatamente assim:

**Configuração Correta:**

- **Name**: `send-credentials-email`
- **Table**: `company_setup_credentials` (selecione da lista)
- **Events**: Marque apenas `INSERT` ✓
- **HTTP Request**:
  - **URL**: `https://ewulvegytmqcyhplnqcp.supabase.co/functions/v1/send-email`
    - ⚠️ Substitua `ewulvegytmqcyhplnqcp` pelo seu project reference se diferente
  - **Method**: `POST`
  - **HTTP Headers**: Clique em **Add Header** e adicione:
    - **Header 1**:
      - Name: `Content-Type`
      - Value: `application/json`
    - **Header 2**:
      - Name: `Authorization`
      - Value: `Bearer SUA_SERVICE_ROLE_KEY_AQUI`
        - ⚠️ Substitua `SUA_SERVICE_ROLE_KEY_AQUI` pela service_role_key que você copiou
  - **HTTP Parameters**: Deixe vazio (não é necessário para este webhook)

4. Clique em **Save** ou **Create**

**Como Funciona:**

O Supabase **automaticamente** envia os dados do registro no body da requisição em formato JSON. O payload padrão será algo como:

```json
{
  "type": "INSERT",
  "table": "company_setup_credentials",
  "record": {
    "user_id": "uuid-do-usuario",
    "subdomain": "subdomain-exemplo",
    "admin_username": "admin",
    "admin_password": "senha123"
  },
  "old_record": null
}
```

A Edge Function foi atualizada para processar este formato padrão do Supabase e extrair os dados necessários.

**Pontos Importantes:**
- ✅ Use **service_role_key** (não anon_key) no header Authorization
- ✅ O Supabase envia automaticamente os dados no body JSON
- ✅ A Edge Function processa o payload padrão do Supabase
- ✅ **HTTP Headers** são usados para Content-Type e Authorization
- ✅ **HTTP Parameters** não são necessários (deixe vazio)

## Solução 2: Usar pg_net Diretamente (Alternativa)

Se o webhook continuar com problemas, podemos usar `pg_net` diretamente na função do banco:

```sql
-- Atualizar função para usar pg_net com service_role_key
-- (requer configurar a key como variável ou hardcoded temporariamente)
```

**Nota**: Esta abordagem requer que você tenha a `service_role_key` disponível no banco, o que não é recomendado por segurança.

## Solução 3: Usar Edge Function com Autenticação Interna

Atualizar a Edge Function para aceitar requisições sem autenticação quando chamada internamente, ou usar um token compartilhado.

## Verificação

Após reconfigurar o webhook:

1. **Crie um novo usuário** no sistema
2. **Verifique os logs do webhook** no Dashboard:
   - Vá em **Database** > **Webhooks** > **send-credentials-email** > **Logs**
3. **Verifique os logs da Edge Function**:
   - Vá em **Edge Functions** > **send-email** > **Logs**
4. **Confirme que o email foi enviado**

## Troubleshooting

### Ainda recebendo 401?

1. **Verifique se está usando service_role_key** (não anon_key)
2. **Verifique se o header Authorization está correto**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Teste a Edge Function manualmente**:
   ```bash
   curl -X POST https://ewulvegytmqcyhplnqcp.supabase.co/functions/v1/send-email \
     -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "credentials",
       "userId": "um-user-id-de-teste",
       "subdomain": "teste",
       "adminUsername": "admin",
       "adminPassword": "senha123"
     }'
   ```

### Placeholders não estão sendo substituídos?

1. **Verifique se o Body Type está como JSON** (não query string)
2. **Verifique se os placeholders estão corretos**: `{{record.user_id}}` (com chaves duplas)
3. **Teste com valores fixos primeiro** para verificar se a Edge Function funciona

### Email não está sendo enviado mesmo com 200 OK?

1. **Verifique as variáveis de ambiente** da Edge Function:
   - `RESEND_API_KEY` está configurada?
   - `RESEND_FROM_EMAIL` está configurada?
2. **Verifique os logs do Resend** no dashboard do Resend
3. **Verifique se o domínio está verificado** no Resend

---

**Data:** 2025-01-16  
**Projeto:** ewulvegytmqcyhplnqcp

