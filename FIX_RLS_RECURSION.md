# Correção de Recursão Infinita nas Políticas RLS

## Problema

O erro `infinite recursion detected in policy for relation "user_profiles"` ocorre porque as políticas RLS estão consultando a própria tabela `user_profiles` dentro de outras políticas de `user_profiles`, criando um loop infinito.

## Solução

Foi criada uma migration de correção (`20250115000007_fix_rls_recursion.sql`) que:

1. Cria uma função `is_super_admin()` com `SECURITY DEFINER` que bypassa RLS
2. Recria todas as políticas de `user_profiles` e `companies` sem recursão
3. Atualiza a função `get_users_with_email()` para usar a nova função auxiliar

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard do seu projeto
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `supabase/migrations/20250115000007_fix_rls_recursion.sql`
4. Clique em **Run** para executar

### Opção 2: Via CLI

```bash
# Se você estiver usando Supabase CLI localmente
supabase db push
```

## Verificação

Após aplicar a migration, verifique se o erro foi corrigido:

1. Recarregue a aplicação no navegador
2. Verifique o console do navegador - não deve mais aparecer o erro de recursão
3. Tente fazer login e navegar pelas páginas

## Se o Problema Persistir

Se ainda houver recursão após aplicar a migration:

1. Verifique se a função `is_super_admin()` foi criada:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'is_super_admin';
   ```

2. Verifique se as políticas foram recriadas:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';
   ```

3. Se necessário, execute manualmente os comandos DROP e CREATE das políticas no SQL Editor

## Notas Importantes

- A função `is_super_admin()` usa `SECURITY DEFINER` para bypassar RLS e evitar recursão
- As políticas foram reorganizadas para evitar dependências circulares
- A verificação de `is_active` foi removida das políticas RLS (será feita na aplicação) para evitar recursão

