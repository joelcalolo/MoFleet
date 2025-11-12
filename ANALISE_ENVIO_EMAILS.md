# Análise: Sistema de Envio de Emails

## Resumo Executivo

**Status Atual:** O sistema está usando **Supabase Auth padrão** para enviar emails de autenticação. Não há interceptação ou customização de emails.

## Componentes Encontrados

### 1. Edge Function (Não Utilizada)
**Arquivo:** `supabase/functions/send-email/index.ts`

- ✅ **Existe** mas **NÃO está sendo chamada**
- Envia emails via Resend API
- Suporta tipos: `confirmation` e `password_reset`
- Templates HTML customizados

**Status:** ⚠️ **Não está em uso**

### 2. EmailService (Não Utilizado)
**Arquivo:** `src/lib/emailService.ts`

- ✅ **Existe** mas **NÃO está sendo importado/usado**
- Classe que chama a Edge Function `send-email`
- Métodos: `sendConfirmationEmail()` e `sendPasswordResetEmail()`

**Status:** ⚠️ **Não está em uso**

### 3. Resend Library (Não Utilizada)
**Arquivo:** `src/lib/resend.ts`

- ✅ **Existe** mas **NÃO está sendo usada**
- Funções para enviar emails diretamente via Resend
- Templates de email customizados

**Status:** ⚠️ **Não está em uso**

### 4. Trigger no Banco de Dados
**Arquivo:** `supabase/migrations/20250115000002_create_companies_and_user_profiles.sql`

- ✅ **Existe** e **ESTÁ ATIVO**
- Trigger: `on_auth_user_created`
- Função: `handle_new_user()`
- **Ação:** Cria `company` e `user_profile` quando novo usuário é criado
- **NÃO envia emails** - apenas cria registros relacionados

**Status:** ✅ **Ativo, mas não envia emails**

## Fluxo Atual de Autenticação

### Cadastro (Sign Up)
```typescript
// Arquivo: src/pages/Auth.tsx (linha 145)
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
    data: { company_name: companyName },
  },
});
```

**O que acontece:**
1. Supabase Auth envia email de confirmação **automaticamente**
2. Trigger `on_auth_user_created` cria company e user_profile
3. **Nenhum código customizado intercepta ou modifica o email**

### Redefinição de Senha
```typescript
// Arquivo: src/pages/Auth.tsx (linha 98)
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth?mode=reset-password`,
});
```

**O que acontece:**
1. Supabase Auth envia email de redefinição **automaticamente**
2. **Nenhum código customizado intercepta ou modifica o email**

## Conclusão

### ✅ O que está funcionando:
- Supabase Auth envia emails automaticamente
- Emails de confirmação e redefinição de senha funcionam
- Templates padrão do Supabase são usados

### ⚠️ O que existe mas não está sendo usado:
- Edge Function `send-email` (pronta para uso)
- EmailService (pronto para uso)
- Resend library (pronta para uso)
- Templates customizados (prontos para uso)

### 📋 Recomendações

**Opção 1: Manter Supabase Auth (Recomendado)**
- ✅ Mais simples
- ✅ Menos manutenção
- ✅ Funciona automaticamente
- ⚠️ Templates limitados aos padrões do Supabase

**Opção 2: Usar Edge Function + Resend**
- ✅ Templates totalmente customizados
- ✅ Controle total sobre design
- ⚠️ Requer modificar `Auth.tsx` para chamar `EmailService`
- ⚠️ Requer configurar variáveis de ambiente do Resend
- ⚠️ Mais complexo de manter

## Como Ativar Email Customizado (Se Desejado)

Se quiser usar os templates customizados via Resend:

1. **Modificar `src/pages/Auth.tsx`:**
   ```typescript
   import { EmailService } from "@/lib/emailService";
   
   // Após signUp, chamar:
   const { data } = await supabase.auth.signUp(...);
   if (data.user) {
     const confirmationLink = `${window.location.origin}/auth/confirm?token=...`;
     await EmailService.sendConfirmationEmail(email, confirmationLink, companyName);
   }
   ```

2. **Configurar variáveis de ambiente:**
   - `RESEND_API_KEY` na Vercel
   - `RESEND_FROM_EMAIL` na Vercel

3. **Deploy da Edge Function:**
   ```bash
   supabase functions deploy send-email
   ```

**Nota:** Isso desabilitaria os emails automáticos do Supabase Auth e usaria apenas os customizados.

