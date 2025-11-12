# Aplicar Migration: Adicionar Campos de Entrega e Recolha

Esta migration adiciona os campos `with_delivery` e `with_pickup` à tabela `reservations`.

## Arquivo da Migration

`supabase/migrations/20250115000008_add_delivery_pickup_to_reservations.sql`

## O que a Migration Faz

1. Adiciona o campo `with_delivery` (BOOLEAN, padrão: true) à tabela `reservations`
2. Adiciona o campo `with_pickup` (BOOLEAN, padrão: true) à tabela `reservations`
3. Atualiza reservas existentes para ter ambos os serviços habilitados por padrão

## Como Aplicar

### Opção 1: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `supabase/migrations/20250115000008_add_delivery_pickup_to_reservations.sql`
4. Execute a query

### Opção 2: Via Supabase CLI

```bash
# Certifique-se de estar na raiz do projeto
cd c:\Users\PC\Joel\rental

# Aplique a migration
supabase db push
```

### Opção 3: Executar Manualmente

Execute o seguinte SQL no Supabase Dashboard:

```sql
-- Add with_delivery and with_pickup fields to reservations table
ALTER TABLE public.reservations 
ADD COLUMN with_delivery BOOLEAN DEFAULT true,
ADD COLUMN with_pickup BOOLEAN DEFAULT true;

-- Add comments to explain the fields
COMMENT ON COLUMN public.reservations.with_delivery IS 'Indica se a reserva inclui serviço de entrega do veículo';
COMMENT ON COLUMN public.reservations.with_pickup IS 'Indica se a reserva inclui serviço de recolha do veículo';

-- Update existing reservations to have both services enabled by default
UPDATE public.reservations 
SET with_delivery = true, with_pickup = true 
WHERE with_delivery IS NULL OR with_pickup IS NULL;
```

## Verificação

Após aplicar a migration, verifique se os campos foram adicionados:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('with_delivery', 'with_pickup');
```

Você deve ver:
- `with_delivery` | boolean | true
- `with_pickup` | boolean | true

## Nota

Após aplicar a migration, os tipos TypeScript serão atualizados automaticamente na próxima vez que você executar `supabase gen types typescript --local` ou quando o Supabase sincronizar os tipos.

