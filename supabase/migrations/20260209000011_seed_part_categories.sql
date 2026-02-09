-- Seed: Inserir categorias de peças de referência
-- Código, Nome, Descrição (exemplos), Cor, Prioridade
-- Executa apenas inserts; use ON CONFLICT para não duplicar por code

INSERT INTO public.part_categories (code, name, description, color, priority) VALUES
  ('TRV', 'Travões', 'Calços, pastilhas, discos, tambores, servo-freio, fluido', '#E74C3C', 'Alta'),
  ('MOT', 'Motor', 'Correias, velas, correntes distribuição, juntas cabeçote', '#3498DB', 'Alta'),
  ('SUS', 'Suspensão', 'Amortecedores, molas, buchas braços, bieletas', '#9B59B6', 'Média'),
  ('ELE', 'Elétrico', 'Baterias, alternadores, lâmpadas H4/H7, fusíveis, relés', '#F39C12', 'Alta'),
  ('FIL', 'Filtros', 'Ar, óleo, combustível, habitáculo, transmissão', '#1ABC9C', 'Alta'),
  ('LUB', 'Lubrificantes', 'Óleo 5W30/10W40/15W50, ATF, óleo diferencial, aditivos', '#16A085', 'Alta'),
  ('TRA', 'Transmissão', 'Kit embraiagem, caixas velocidades, semieixos, juntas CV', '#2C3E50', 'Média'),
  ('ARR', 'Arrefecimento', 'Radiadores, termostatos, ventoinhas, líquido refrigerante', '#3498DB', 'Média'),
  ('ESC', 'Escape', 'Catalisadores, panelas, tubos escape, sensores O2', '#95A5A6', 'Baixa'),
  ('CAR', 'Carroçaria', 'Para-choques, faróis, retrovisores, vidros, grelhas', '#34495E', 'Média'),
  ('INT', 'Interior', 'Bancos, painéis, tapetes, cintos segurança, manípulos', '#7F8C8D', 'Baixa'),
  ('PNE', 'Pneus e Rodas', 'Pneus 265/65R17, válvulas, porcas roda, tampões centro', '#2C3E50', 'Alta'),
  ('COM', 'Combustível', 'Bombas combustível, injetores, reguladores pressão', '#E67E22', 'Média'),
  ('DIR', 'Direção', 'Caixas direção, bombas hidráulicas, terminais, barras', '#8E44AD', 'Média'),
  ('CLI', 'Climatização', 'Compressor AC, condensador, gás R134a, filtros', '#5DADE2', 'Média'),
  ('QUI', 'Produtos Químicos', 'Limpa-travões, WD-40, silicone spray, massa veda juntas', '#E74C3C', 'Média'),
  ('CON', 'Consumíveis', 'Fita isoladora, abraçadeiras, parafusos, rebites, cola', '#BDC3C7', 'Alta'),
  ('FER', 'Ferramentas', 'Chaves combinadas, alicates, macaco hidráulico, scanner OBD', '#34495E', 'Baixa'),
  ('SEG', 'Segurança', 'Triângulos, extintores, kits 1ºs socorros, coletes', '#C0392B', 'Alta'),
  ('LIM', 'Limpeza', 'Shampoo auto, cera, escovas, panos microfibra, aspirador', '#27AE60', 'Baixa'),
  ('ADM', 'Administrativo', 'Selos revisão, etiquetas identificação, livros manutenção', '#7D3C98', 'Baixa'),
  ('OUT', 'Outros', 'Itens diversos não categorizados', '#95A5A6', 'Baixa')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  priority = EXCLUDED.priority,
  updated_at = now();
