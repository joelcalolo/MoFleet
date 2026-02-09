-- Garantir acesso à view current_stock
-- Views herdam as políticas RLS das tabelas base, mas precisam de GRANT explícito

-- Garantir que a view existe e está acessível
-- Se a view não existir, esta migração falhará e você precisará executar 20260209000007 primeiro
DO $$
BEGIN
  -- Verificar se a view existe
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'current_stock') THEN
    -- Garantir acesso para usuários autenticados
    GRANT SELECT ON public.current_stock TO authenticated;
    RAISE NOTICE 'Permissões atualizadas para a view current_stock';
  ELSE
    RAISE WARNING 'A view current_stock não existe. Execute a migração 20260209000007_create_current_stock_view.sql primeiro.';
  END IF;
END $$;
