# Corrigir Erro: function unaccent(text) does not exist

## Problema

Ao criar um novo usuário, você recebe o erro:
```
ERROR: function unaccent(text) does not exist (SQLSTATE 42883)
Database error saving new user
```

## Causa Raiz

A função `remove_accents()` estava tentando usar a extensão PostgreSQL `unaccent`, mas:

1. A extensão `unaccent` pode não estar disponível no Supabase (requer permissões especiais)
2. Mesmo verificando se a extensão existe, a função `unaccent()` pode não estar acessível
3. Quando `unaccent()` falha, toda a transação é abortada, causando o erro "Database error saving new user"

## Solução

Foi criada uma nova migration (`20250116000008_fix_unaccent_function.sql`) que:

1. **Remove a dependência de `unaccent`**: A função `remove_accents()` agora usa apenas `translate()`, que é uma função nativa do PostgreSQL
2. **Sempre funciona**: Não depende de extensões externas
3. **Mesma funcionalidade**: Remove acentos corretamente usando substituição manual

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `supabase/migrations/20250116000008_fix_unaccent_function.sql`:

```sql
-- Corrigir função remove_accents para lidar com unaccent não disponível
CREATE OR REPLACE FUNCTION public.remove_accents(text_in TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE
AS $$
BEGIN
  -- Usar translate para remover acentos manualmente
  RETURN translate(
    text_in,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeeiiiiooooouuuucnAAAAAEEEEEIIIIOOOOOUUUUCN'
  );
END;
$$;
```

4. Clique em **Run** para executar

### Opção 2: Via Supabase CLI

```bash
# Aplicar a migration
supabase db push

# Ou aplicar migration específica
supabase migration up 20250116000008_fix_unaccent_function
```

### Opção 3: Aplicar Manualmente

Execute o SQL acima diretamente no banco de dados.

## Verificação

Após aplicar a correção:

1. **Teste criando um novo usuário** no sistema
2. **Verifique se o erro desapareceu**
3. **Confirme que o subdomain é gerado corretamente** (mesmo com acentos no nome da empresa)

## Exemplo de Funcionamento

Antes (com erro):
- Nome da empresa: "Empresa São Paulo"
- ❌ Erro: `function unaccent(text) does not exist`
- ❌ Usuário não é criado

Depois (corrigido):
- Nome da empresa: "Empresa São Paulo"
- ✅ Subdomain gerado: `empresa-sao-paulo`
- ✅ Usuário criado com sucesso

## Detalhes Técnicos

### Função Antiga (Problemática)
```sql
CREATE OR REPLACE FUNCTION public.remove_accents(text_in TEXT)
RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    RETURN unaccent(text_in);  -- ❌ Pode falhar mesmo se extensão existir
  ELSE
    RETURN translate(...);  -- Fallback
  END IF;
END;
$$;
```

### Função Nova (Corrigida)
```sql
CREATE OR REPLACE FUNCTION public.remove_accents(text_in TEXT)
RETURNS TEXT AS $$
BEGIN
  -- ✅ Sempre usa translate, não depende de extensões
  RETURN translate(
    text_in,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeeiiiiooooouuuucnAAAAAEEEEEIIIIOOOOOUUUUCN'
  );
END;
$$;
```

## Por Que Esta Solução é Melhor

1. ✅ **Não depende de extensões**: Funciona em qualquer instalação PostgreSQL
2. ✅ **Mais confiável**: Não há risco de erro por extensão não disponível
3. ✅ **Mesma performance**: `translate()` é uma função nativa otimizada
4. ✅ **Cobre todos os acentos**: Inclui todos os caracteres acentuados comuns em português

## Notas

- A função `remove_accents()` é usada pela função `handle_new_user()` para gerar subdomains a partir do nome da empresa
- Esta correção não afeta funcionalidades existentes, apenas torna a função mais robusta
- Não é necessário remover a tentativa de criar a extensão `unaccent` da migration anterior, ela simplesmente não será usada

## Troubleshooting

### Ainda recebendo erro após aplicar?

1. **Verifique se a função foi atualizada:**
   ```sql
   SELECT pg_get_functiondef('public.remove_accents'::regproc);
   ```

2. **Teste a função manualmente:**
   ```sql
   SELECT public.remove_accents('São Paulo');
   -- Deve retornar: 'Sao Paulo'
   ```

3. **Verifique se há outras funções usando unaccent:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_definition LIKE '%unaccent%';
   ```

4. **Limpe o cache do banco** (se aplicável) e tente novamente

---

**Data da correção:** 2025-01-16  
**Migration:** `20250116000008_fix_unaccent_function.sql`

