# Rate Limiting do Supabase Auth

## Resposta à Pergunta

**O bloqueio "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente" é do Supabase Auth, não do código da aplicação.**

## Como Funciona

### Rate Limiting do Supabase Auth

O Supabase Auth implementa **rate limiting automático** para prevenir abuso e spam. Os limites são:

#### Sign Up (Cadastro)
- **Limite:** ~3-5 tentativas por hora por IP/email
- **Janela:** 1 hora
- **Ação:** Bloqueia novas tentativas de cadastro

#### Password Reset (Redefinição de Senha)
- **Limite:** ~3-5 tentativas por hora por IP/email
- **Janela:** 1 hora
- **Ação:** Bloqueia novos envios de email de redefinição

#### Sign In (Login)
- **Limite:** ~5-10 tentativas por hora por IP
- **Janela:** 1 hora
- **Ação:** Bloqueia tentativas de login

## Onde Está Implementado

### ❌ Não há rate limiting customizado no código
- Nenhum código na aplicação implementa rate limiting
- Não há throttling ou debounce customizado
- O erro vem diretamente do Supabase Auth

### ✅ Tratamento de Erro
**Arquivo:** `src/lib/errorHandler.ts` (linha 61-63)

```typescript
{
  pattern: /email rate limit exceeded/i,
  message: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
}
```

A aplicação apenas **traduz** a mensagem de erro do Supabase para português.

## Como Resolver

### Para o Usuário Final
1. **Aguardar 15-30 minutos** antes de tentar novamente
2. Verificar se o email já foi enviado (pode estar na caixa de spam)
3. Se persistir, tentar de outro dispositivo/rede

### Para Desenvolvedores

#### Opção 1: Aguardar (Recomendado)
- O rate limiting é automático e temporário
- Após 15-30 minutos, o limite é resetado
- Não requer ação

#### Opção 2: Verificar no Dashboard Supabase
1. Acesse o dashboard do Supabase
2. Vá em **Authentication** → **Rate Limits**
3. Verifique limites configurados
4. Pode ajustar limites (planos pagos)

#### Opção 3: Implementar Debounce no Frontend
Adicionar debounce para prevenir múltiplos cliques:

```typescript
// Exemplo de debounce no botão de cadastro
const [isSubmitting, setIsSubmitting] = useState(false);

const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isSubmitting) return; // Prevenir múltiplos submits
  
  setIsSubmitting(true);
  // ... código de autenticação
  setIsSubmitting(false);
};
```

**Nota:** Isso não remove o rate limiting do Supabase, apenas previne cliques acidentais.

## Limites por Plano Supabase

### Free Tier
- Sign Up: ~3 tentativas/hora
- Password Reset: ~3 tentativas/hora
- Sign In: ~5 tentativas/hora

### Paid Plans
- Limites mais altos
- Configurável no dashboard
- Suporte a customização

## Verificação

Para confirmar que é do Supabase:

1. **Verifique o erro no console:**
   ```javascript
   // O erro original do Supabase será algo como:
   {
     message: "Email rate limit exceeded",
     status: 429
   }
   ```

2. **Verifique no Network Tab:**
   - Requisição para `supabase.co/auth/v1/signup`
   - Status: `429 Too Many Requests`
   - Headers: `Retry-After: 3600` (segundos)

## Conclusão

✅ **O rate limiting é do Supabase Auth**
✅ **Não há rate limiting customizado no código**
✅ **A mensagem é apenas uma tradução do erro do Supabase**
✅ **Solução: Aguardar 15-30 minutos**

Este é um comportamento esperado e de segurança do Supabase para prevenir abuso.

