-- Bucket para logos da empresa (Configurações > upload de logo).
-- Permite upload/update/delete por utilizadores autenticados e leitura pública.
-- O id/name 'company-logos' é o usado na API: supabase.storage.from('company-logos').

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas em storage.objects para o bucket company-logos (idempotente)
DROP POLICY IF EXISTS "company-logos: public read" ON storage.objects;
DROP POLICY IF EXISTS "company-logos: authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "company-logos: authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "company-logos: authenticated delete" ON storage.objects;

CREATE POLICY "company-logos: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

CREATE POLICY "company-logos: authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "company-logos: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos');

CREATE POLICY "company-logos: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');
