# Corrigir Acesso ao pgcrypto - Schema Access

## Problema

Mesmo com a extensão `pgcrypto` instalada, você recebe o erro:
```
ERROR: Extensão pgcrypto não está disponível. Por favor, habilite-a no Supabase Dashboard
```

## Causa

A extensão `pgcrypto` está instalada, mas a função `digest()` não está sendo encontrada porque:
1. O schema `pgcrypto` pode não estar no `search_path` da função
2. A função precisa ser chamada com schema explícito: `pgcrypto.digest()`
3. O `search_path` pode não incluir o schema `pgcrypto`

## Solução

Foi criada uma nova migration (`20250116000011_fix_pgcrypto_schema_access.sql`) que:

1. **Define `search_path` explicitamente** na função `handle_new_user()`
2. **Tenta múltiplas formas** de acessar `digest()`:
   - Primeiro tenta com `search_path` incluindo `pgcrypto`
   - Depois tenta `pgcrypto.digest()` explicitamente
   - Por último tenta `public.digest()` (caso esteja no schema public)
3. **Melhor tratamento de erros** com mensagens mais claras

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `supabase/migrations/20250116000011_fix_pgcrypto_schema_access.sql`
4. Clique em **Run**

### Opção 2: Via Supabase CLI

```bash
supabase db push
```

## Verificação

Após aplicar a migration:

1. **Verifique se a extensão está instalada:**
   ```sql
   SELECT extname, extversion, nspname 
   FROM pg_extension e
   JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE extname = 'pgcrypto';
   ```
   
   Deve retornar:
   - `extname = 'pgcrypto'`
   - `nspname = 'pgcrypto'` (schema onde está instalada)

2. **Teste a função digest:**
   ```sql
   SELECT encode(pgcrypto.digest('teste', 'sha256'), 'hex');
   ```
   
   Deve retornar um hash hexadecimal (64 caracteres)

3. **Teste criando um novo usuário** no sistema

## O Que Foi Corrigido

### Antes (Problemático)
```sql
-- Tentava usar digest() sem garantir que pgcrypto está no search_path
admin_password_hash := encode(digest(admin_password, 'sha256'), 'hex');
```

### Depois (Corrigido)
```sql
-- Define search_path explicitamente na função
CREATE OR REPLACE FUNCTION ... SET search_path = public, pgcrypto;

-- Tenta múltiplas formas de acessar
BEGIN
  PERFORM set_config('search_path', 'public, pgcrypto', false);
  admin_password_hash := encode(digest(admin_password, 'sha256'), 'hex');
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: usar schema explícito
    admin_password_hash := encode(pgcrypto.digest(admin_password, 'sha256'), 'hex');
END;
```

## Troubleshooting

### Ainda recebendo erro após aplicar a migration?

1. **Verifique se pgcrypto está realmente instalada:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
   ```
   
   Se não retornar nada, a extensão não está instalada. Habilite no Dashboard.

2. **Verifique em qual schema está instalada:**
   ```sql
   SELECT e.extname, n.nspname 
   FROM pg_extension e
   JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'pgcrypto';
   ```

3. **Teste acesso direto:**
   ```sql
   -- Teste 1: Com schema explícito
   SELECT encode(pgcrypto.digest('teste', 'sha256'), 'hex');
   
   -- Teste 2: Sem schema (deve funcionar se estiver no search_path)
   SET search_path = public, pgcrypto;
   SELECT encode(digest('teste', 'sha256'), 'hex');
   ```

4. **Verifique os logs da função:**
   - Vá em **Database** > **Functions** > **handle_new_user**
   - Verifique se há erros nos logs

### Extensão está em schema diferente?

Se a extensão estiver em um schema diferente de `pgcrypto`, você pode:

1. **Reinstalar a extensão no schema correto:**
   ```sql
   DROP EXTENSION IF EXISTS pgcrypto;
   CREATE EXTENSION pgcrypto SCHEMA pgcrypto;
   ```

2. **Ou ajustar a função para usar o schema correto**

## Notas Importantes

- A migration `20250116000011_fix_pgcrypto_schema_access.sql` **substitui** a função `handle_new_user()` completamente
- Ela inclui todas as funcionalidades anteriores + correção do acesso ao pgcrypto
- Não é necessário aplicar migrations anteriores se aplicar esta

---

**Data da correção:** 2025-01-16  
**Migration:** `20250116000011_fix_pgcrypto_schema_access.sql`

