# Instruções para Executar Migrations

## Problema: Coluna company_id não encontrada

Se você está recebendo o erro "Could not find the 'company_id' column of 'checkouts' in the schema cache", isso significa que a migration `20250115000003_update_checkouts_checkins.sql` ainda não foi executada no seu banco de dados.

## Solução

### Opção 1: Usando Supabase CLI (Recomendado)

1. Certifique-se de que o Supabase CLI está instalado:
```bash
npm install -g supabase
```

2. Execute as migrations:
```bash
supabase db push
```

Ou se estiver usando Supabase local:
```bash
supabase migration up
```

### Opção 2: Executar Manualmente no Dashboard do Supabase

1. Acesse o Dashboard do Supabase: https://app.supabase.com
2. Vá para o projeto
3. Navegue até **SQL Editor**
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20250115000003_update_checkouts_checkins.sql`
5. Execute o SQL

### Opção 3: Executar SQL Diretamente

Execute o seguinte SQL no seu banco de dados:

```sql
-- Adicionar campos faltantes em checkouts
ALTER TABLE public.checkouts
  ADD COLUMN IF NOT EXISTS delivered_by TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Adicionar campos faltantes em checkins
ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS received_by TEXT,
  ADD COLUMN IF NOT EXISTS deposit_returned_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Atualizar políticas RLS para checkouts
DROP POLICY IF EXISTS "Authenticated users can view checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can insert checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can update checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated users can delete checkouts" ON public.checkouts;

CREATE POLICY "Users can view checkouts from their company" ON public.checkouts FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkouts to their company" ON public.checkouts FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkouts from their company" ON public.checkouts FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkouts from their company" ON public.checkouts FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Atualizar políticas RLS para checkins
DROP POLICY IF EXISTS "Authenticated users can view checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can insert checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can update checkins" ON public.checkins;
DROP POLICY IF EXISTS "Authenticated users can delete checkins" ON public.checkins;

CREATE POLICY "Users can view checkins from their company" ON public.checkins FOR SELECT TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkins to their company" ON public.checkins FOR INSERT TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkins from their company" ON public.checkins FOR UPDATE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkins from their company" ON public.checkins FOR DELETE TO authenticated 
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );
```

## Verificar se a Migration foi Aplicada

Para verificar se as colunas foram adicionadas, execute:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'checkouts' 
AND column_name IN ('company_id', 'delivered_by');
```

Você deve ver ambas as colunas listadas.

## Nota

Após executar a migration, você pode precisar atualizar os tipos TypeScript do Supabase executando:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

Ou se estiver usando Supabase local:

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

