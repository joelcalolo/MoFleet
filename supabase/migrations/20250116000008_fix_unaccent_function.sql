-- Corrigir função remove_accents para lidar com unaccent não disponível
-- Esta migration corrige o erro "function unaccent(text) does not exist"
-- Solução: usar sempre o fallback com translate, que é mais confiável e não depende de extensões

-- Recriar função remove_accents usando apenas translate (sem dependência de unaccent)
CREATE OR REPLACE FUNCTION public.remove_accents(text_in TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE
AS $$
BEGIN
  -- Usar translate para remover acentos manualmente
  -- Esta solução é mais confiável e não depende de extensões PostgreSQL
  RETURN translate(
    text_in,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeeiiiiooooouuuucnAAAAAEEEEEIIIIOOOOOUUUUCN'
  );
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.remove_accents(TEXT) IS 
'Remove acentos de texto usando translate. Não depende de extensões PostgreSQL e sempre funciona.';

