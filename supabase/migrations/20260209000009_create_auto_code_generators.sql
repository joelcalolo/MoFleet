-- Migration: Criar funções para gerar códigos automáticos
-- Lógica inteligente para códigos hierárquicos e semelhantes

-- ============================================================================
-- FUNÇÃO 1: Gerar código de fornecedor (FORN001, FORN002, ...)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_supplier_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  last_number INTEGER;
  new_code TEXT;
BEGIN
  -- Buscar último número
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0)
  INTO last_number
  FROM public.suppliers
  WHERE code LIKE 'FORN%' AND LENGTH(code) = 8;
  
  -- Incrementar e formatar (FORN001, FORN002, etc.)
  new_code := 'FORN' || LPAD((last_number + 1)::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$;

-- ============================================================================
-- FUNÇÃO 2: Gerar código de categoria baseado no nome (abreviação inteligente)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_category_code(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  words TEXT[];
  code TEXT := '';
  word TEXT;
  i INTEGER;
  cleaned_name TEXT;
BEGIN
  -- Remover acentos e converter para maiúsculas
  cleaned_name := UPPER(TRANSLATE(p_name, 'ÁÀÂÃÉÊÍÓÔÕÚÇ', 'AAAAEEIOOUC'));
  
  -- Remover caracteres especiais e espaços extras
  cleaned_name := REGEXP_REPLACE(cleaned_name, '[^A-Z0-9 ]', '', 'g');
  cleaned_name := TRIM(REGEXP_REPLACE(cleaned_name, '\s+', ' ', 'g'));
  
  -- Dividir em palavras
  words := string_to_array(cleaned_name, ' ');
  
  -- Se nome tem 1 palavra
  IF array_length(words, 1) = 1 THEN
    word := words[1];
    -- Se palavra tem <= 3 caracteres, usar completo
    IF LENGTH(word) <= 3 THEN
      RETURN word;
    -- Se palavra tem 4-6 caracteres, usar primeiras 3 letras
    ELSIF LENGTH(word) <= 6 THEN
      RETURN SUBSTRING(word FROM 1 FOR 3);
    -- Se palavra tem > 6 caracteres, usar primeiras 3 letras
    ELSE
      RETURN SUBSTRING(word FROM 1 FOR 3);
    END IF;
  END IF;
  
  -- Se nome tem múltiplas palavras, usar primeira letra de cada palavra
  -- Máximo 3 letras para códigos curtos e legíveis
  FOR i IN 1..LEAST(array_length(words, 1), 3) LOOP
    word := words[i];
    IF LENGTH(word) > 0 THEN
      code := code || SUBSTRING(word FROM 1 FOR 1);
    END IF;
  END LOOP;
  
  -- Garantir mínimo de 2 caracteres
  IF LENGTH(code) < 2 THEN
    code := SUBSTRING(cleaned_name FROM 1 FOR 2);
  END IF;
  
  -- Garantir máximo de 10 caracteres (conforme schema)
  code := SUBSTRING(code FROM 1 FOR 10);
  
  RETURN code;
END;
$$;

-- ============================================================================
-- FUNÇÃO 3: Gerar código de peça baseado em categoria + modelo + sequencial
-- Formato: CAT-MODELO-001 (ex: TRV-PRADO-001, MOT-CX9-002)
-- Produtos similares (mesma categoria + modelo) terão códigos semelhantes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_part_code(
  p_category_id UUID,
  p_car_model_reference TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  category_code TEXT;
  model_prefix TEXT := '';
  last_number INTEGER;
  new_code TEXT;
  base_code TEXT;
  cleaned_model TEXT;
BEGIN
  -- Buscar código da categoria
  SELECT code INTO category_code
  FROM public.part_categories
  WHERE id = p_category_id;
  
  IF category_code IS NULL THEN
    RAISE EXCEPTION 'Categoria não encontrada';
  END IF;
  
  -- Processar modelo de carro para prefixo
  IF p_car_model_reference IS NOT NULL AND TRIM(p_car_model_reference) != '' THEN
    -- Limpar e normalizar modelo
    cleaned_model := UPPER(TRIM(p_car_model_reference));
    
    -- Remover acentos
    cleaned_model := TRANSLATE(cleaned_model, 'ÁÀÂÃÉÊÍÓÔÕÚÇ', 'AAAAEEIOOUC');
    
    -- Se modelo tem espaço, usar primeira palavra (ex: "Prado TXL" -> "PRADO")
    IF POSITION(' ' IN cleaned_model) > 0 THEN
      model_prefix := SPLIT_PART(cleaned_model, ' ', 1);
    ELSE
      model_prefix := cleaned_model;
    END IF;
    
    -- Limitar a 6 caracteres para manter código legível
    IF LENGTH(model_prefix) > 6 THEN
      model_prefix := SUBSTRING(model_prefix FROM 1 FOR 6);
    END IF;
    
    -- Garantir mínimo de 2 caracteres
    IF LENGTH(model_prefix) < 2 THEN
      model_prefix := SUBSTRING(cleaned_model FROM 1 FOR 2);
    END IF;
  ELSE
    -- Se não tem modelo, usar "GEN" (genérico)
    model_prefix := 'GEN';
  END IF;
  
  -- Criar código base: CAT-MODELO
  base_code := category_code || '-' || model_prefix;
  
  -- Buscar último número para esta combinação categoria-modelo
  -- Isso garante que produtos similares tenham códigos sequenciais
  SELECT COALESCE(MAX(CAST(SPLIT_PART(code, '-', 3) AS INTEGER)), 0)
  INTO last_number
  FROM public.parts
  WHERE code LIKE base_code || '-%'
    AND code ~ ('^' || base_code || '-\d+$'); -- Garantir formato correto
  
  -- Incrementar e formatar com 3 dígitos
  new_code := base_code || '-' || LPAD((last_number + 1)::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$;

-- ============================================================================
-- TRIGGER 1: Gerar código de fornecedor automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_supplier_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_supplier_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_supplier_code
  BEFORE INSERT ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_supplier_code();

-- ============================================================================
-- TRIGGER 2: Gerar código de categoria automaticamente baseado no nome
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_category_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  generated_code TEXT;
  code_exists BOOLEAN;
  counter INTEGER := 1;
  final_code TEXT;
  current_id UUID;
BEGIN
  -- Só gerar se código está vazio ou NULL
  IF NEW.code IS NULL OR TRIM(NEW.code) = '' THEN
    -- Gerar código baseado no nome
    generated_code := public.generate_category_code(NEW.name);
    final_code := generated_code;
    
    -- Usar ID atual se estiver em UPDATE, senão NULL
    current_id := COALESCE(NEW.id, NULL);
    
    -- Verificar se código já existe, se sim, adicionar número
    LOOP
      IF current_id IS NULL THEN
        -- INSERT: verificar se código existe
        SELECT EXISTS(SELECT 1 FROM public.part_categories WHERE code = final_code)
        INTO code_exists;
      ELSE
        -- UPDATE: verificar se código existe em outro registro
        SELECT EXISTS(SELECT 1 FROM public.part_categories WHERE code = final_code AND id != current_id)
        INTO code_exists;
      END IF;
      
      EXIT WHEN NOT code_exists;
      
      -- Adicionar número ao código (máximo 2 dígitos para manter código curto)
      IF counter < 10 THEN
        final_code := generated_code || counter::TEXT;
      ELSE
        -- Se precisar de mais números, usar formato diferente
        final_code := generated_code || '-' || counter::TEXT;
      END IF;
      
      counter := counter + 1;
      
      -- Limitar tentativas
      IF counter > 99 THEN
        -- Fallback: usar timestamp
        final_code := generated_code || '-' || SUBSTRING(EXTRACT(EPOCH FROM NOW())::TEXT FROM -4);
        EXIT;
      END IF;
    END LOOP;
    
    NEW.code := final_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_category_code
  BEFORE INSERT OR UPDATE ON public.part_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_category_code();

-- ============================================================================
-- TRIGGER 3: Gerar código de peça automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_part_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  generated_code TEXT;
  code_exists BOOLEAN;
  counter INTEGER := 1;
  final_code TEXT;
  current_num INTEGER;
  base_part TEXT;
BEGIN
  -- Só gerar se código está vazio ou NULL
  IF NEW.code IS NULL OR TRIM(NEW.code) = '' THEN
    -- Gerar código baseado em categoria e modelo
    generated_code := public.generate_part_code(
      NEW.category_id,
      NEW.car_model_reference
    );
    final_code := generated_code;
    
    -- Verificar se código já existe (pode acontecer em casos raros)
    LOOP
      SELECT EXISTS(SELECT 1 FROM public.parts WHERE code = final_code AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID))
      INTO code_exists;
      
      EXIT WHEN NOT code_exists;
      
      -- Se código existe, incrementar número sequencial
      -- Extrair número atual e incrementar
      base_part := SPLIT_PART(final_code, '-', 1) || '-' || SPLIT_PART(final_code, '-', 2);
      current_num := CAST(SPLIT_PART(final_code, '-', 3) AS INTEGER);
      final_code := base_part || '-' || LPAD((current_num + counter)::TEXT, 3, '0');
      counter := counter + 1;
      
      -- Limitar tentativas
      IF counter > 10 THEN
        -- Fallback: adicionar timestamp
        final_code := generated_code || '-' || SUBSTRING(EXTRACT(EPOCH FROM NOW())::TEXT FROM -3);
        EXIT;
      END IF;
    END LOOP;
    
    NEW.code := final_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_part_code
  BEFORE INSERT ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_part_code();

-- Comentários para documentação
COMMENT ON FUNCTION public.generate_supplier_code() IS 'Gera código sequencial para fornecedores (FORN001, FORN002, ...)';
COMMENT ON FUNCTION public.generate_category_code(TEXT) IS 'Gera código de categoria baseado em abreviação inteligente do nome';
COMMENT ON FUNCTION public.generate_part_code(UUID, TEXT) IS 'Gera código de peça baseado em categoria + modelo de carro + sequencial (ex: TRV-PRADO-001)';
