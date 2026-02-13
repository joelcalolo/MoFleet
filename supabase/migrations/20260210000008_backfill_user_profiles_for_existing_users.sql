-- Inserir user_profiles (e company) para utilizadores que já existem em auth.users
-- mas não têm linha em user_profiles (ex.: registados após remove_multi_tenant).

WITH missing AS (
  SELECT
    u.id AS user_id,
    COALESCE(u.raw_user_meta_data->>'company_name', 'Minha Empresa') AS company_name,
    u.email
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id)
),
new_companies AS (
  INSERT INTO public.companies (name, email)
  SELECT company_name, email FROM missing
  RETURNING id, email
),
insert_profiles AS (
  INSERT INTO public.user_profiles (user_id, company_id, role, is_active)
  SELECT m.user_id, nc.id, 'owner', true
  FROM new_companies nc
  JOIN missing m ON m.email = nc.email
  RETURNING user_id
)
SELECT COUNT(*) AS backfilled_count FROM insert_profiles;
