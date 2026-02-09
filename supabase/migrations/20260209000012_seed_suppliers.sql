-- Seed: Inserir fornecedores de referência
-- Fornecedor genérico para peças sem fornecedor
-- Nota: FOR001 (GondoÁfrica) já existe na base de dados

INSERT INTO public.suppliers (code, name, is_active) VALUES
  ('FOR000', 'Sem Fornecedor', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = now();
