# Corrigir Erro: function digest(text, unknown) does not exist

## Problema

Ao criar um novo usuário, você recebe o erro:
```
ERROR: function digest(text, unknown) does not exist (SQLSTATE 42883)
Database error saving new user
```

## Causa Raiz

A função `digest()` é fornecida pela extensão PostgreSQL `pgcrypto`. Esta extensão:
- Está disponível no Supabase, mas **precisa ser habilitada manualmente**
- É necessária para fazer hash SHA-256 de senhas no banco de dados
- Sem ela, a função `handle_new_user()` não consegue criar o usuário admin automaticamente

## Solução

### Passo 1: Habilitar Extensão pgcrypto no Supabase

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Navegue até Extensions**
   - No menu lateral, clique em **Database**
   - Clique em **Extensions** (ou procure por "Extensions" na barra de busca)

3. **Habilite pgcrypto**
   - Procure por `pgcrypto` na lista de extensões
   - Clique no botão **Enable** ao lado de `pgcrypto`
   - Aguarde alguns segundos para a extensão ser habilitada

4. **Verifique se foi habilitada**
   - A extensão deve aparecer como "Enabled" ou com um check verde
   - Você pode verificar executando este SQL no SQL Editor:
     ```sql
     SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
     ```

### Passo 2: Aplicar a Migration de Correção

Após habilitar a extensão, aplique a migration que corrige o uso de `digest()`:

**Via Supabase Dashboard (SQL Editor):**

1. Vá em **SQL Editor**
2. Execute o conteúdo do arquivo `supabase/migrations/20250116000009_fix_digest_function.sql`
3. Clique em **Run**

**Ou via Supabase CLI:**
```bash
supabase db push
```

## Verificação

Após habilitar a extensão e aplicar a migration:

1. **Teste criando um novo usuário** no sistema
2. **Verifique se o erro desapareceu**
3. **Confirme que o usuário admin é criado automaticamente** com a senha gerada

## O Que a Extensão pgcrypto Faz

A extensão `pgcrypto` fornece funções criptográficas para PostgreSQL, incluindo:

- `digest()` - Faz hash de dados (MD5, SHA1, SHA256, etc.)
- `crypt()` - Criptografia de senhas
- `gen_random_uuid()` - Gera UUIDs aleatórios
- `encrypt()` / `decrypt()` - Criptografia simétrica

No nosso caso, usamos `digest()` para fazer hash SHA-256 das senhas dos usuários admin, garantindo que:
- As senhas não sejam armazenadas em texto plano
- O hash seja compatível com o frontend (que também usa SHA-256)

## Por Que Precisa Ser Habilitada Manualmente?

No Supabase, algumas extensões precisam ser habilitadas manualmente por questões de:
- **Segurança**: Extensões criptográficas requerem permissões especiais
- **Performance**: Nem todas as extensões são necessárias para todos os projetos
- **Controle**: Você escolhe quais extensões usar no seu projeto

## Troubleshooting

### Ainda recebendo erro após habilitar?

1. **Verifique se a extensão está realmente habilitada:**
   ```sql
   SELECT extname, extversion 
   FROM pg_extension 
   WHERE extname = 'pgcrypto';
   ```
   Deve retornar uma linha com `extname = 'pgcrypto'`

2. **Teste a função digest manualmente:**
   ```sql
   SELECT encode(digest('teste', 'sha256'), 'hex');
   ```
   Deve retornar um hash hexadecimal (64 caracteres)

3. **Verifique se há erros na migration:**
   - Execute a migration novamente
   - Verifique os logs no Supabase Dashboard

4. **Limpe o cache e tente novamente:**
   - Aguarde alguns minutos após habilitar a extensão
   - Tente criar um novo usuário novamente

### Não consigo habilitar a extensão?

1. **Verifique suas permissões:**
   - Você precisa ser o owner do projeto ou ter permissões de administrador
   - Se não tiver, peça ao administrador para habilitar

2. **Verifique se o projeto está ativo:**
   - Projetos pausados podem ter limitações
   - Verifique o status do projeto no dashboard

3. **Entre em contato com o suporte do Supabase:**
   - Se a extensão não aparecer na lista, pode ser um problema do Supabase
   - Entre em contato através do dashboard

## Alternativa (Não Recomendada)

Se por algum motivo você não conseguir habilitar `pgcrypto`, você pode modificar o código para fazer o hash no frontend antes de salvar. No entanto, isso requer mudanças no código e não é a solução recomendada, pois:

- ❌ A senha do admin é gerada no banco, então precisaria ser enviada para o frontend primeiro
- ❌ Adiciona complexidade desnecessária
- ❌ Menos seguro (senha em texto plano temporariamente)

**Recomendação:** Sempre use `pgcrypto` quando possível.

## Resumo

1. ✅ **Habilite a extensão `pgcrypto`** no Supabase Dashboard
2. ✅ **Aplique a migration** `20250116000009_fix_digest_function.sql`
3. ✅ **Teste criando um novo usuário**
4. ✅ **Verifique se tudo funciona corretamente**

---

**Data da correção:** 2025-01-16  
**Migration:** `20250116000009_fix_digest_function.sql`  
**Extensão necessária:** `pgcrypto`

