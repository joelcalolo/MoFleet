| schemaname | tablename     | policyname                          | permissive | roles           | cmd    | using_expression       | with_check             |
| ---------- | ------------- | ----------------------------------- | ---------- | --------------- | ------ | ---------------------- | ---------------------- |
| public     | user_profiles | Admins can update all user profiles | PERMISSIVE | {authenticated} | UPDATE | is_admin()             | null                   |
| public     | user_profiles | Admins can view all user profiles   | PERMISSIVE | {authenticated} | SELECT | is_admin()             | null                   |
| public     | user_profiles | Users can insert their own profile  | PERMISSIVE | {authenticated} | INSERT | null                   | (user_id = auth.uid()) |
| public     | user_profiles | Users can update their own profile  | PERMISSIVE | {authenticated} | UPDATE | (user_id = auth.uid()) | null                   |
| public     | user_profiles | Users can view their own profile    | PERMISSIVE | {authenticated} | SELECT | (user_id = auth.uid()) | null                   |



| function_name  | definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| is_admin       | CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  SET LOCAL row_security = off;
  SELECT user_profiles.role, user_profiles.is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_profiles.user_id = auth.uid()
  LIMIT 1;
  RETURN COALESCE(
    (user_role IN ('admin', 'super_admin')) AND (user_active = true OR user_active IS NULL),
    false
  );
END;
$function$
 |
| is_super_admin | CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  SET LOCAL row_security = off;

  SELECT user_profiles.role, user_profiles.is_active INTO user_role, user_active
  FROM public.user_profiles
  WHERE user_profiles.user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role = 'super_admin' AND (user_active = true OR user_active IS NULL), false);
END;
$function$
                    |




| column_name          | data_type                | is_nullable |
| -------------------- | ------------------------ | ----------- |
| id                   | uuid                     | NO          |
| user_id              | uuid                     | NO          |
| role                 | text                     | YES         |
| created_at           | timestamp with time zone | YES         |
| updated_at           | timestamp with time zone | YES         |
| is_active            | boolean                  | YES         |
| must_change_password | boolean                  | YES         |
| position             | text                     | YES         |
| department           | text                     | YES         |
| name                 | text                     | YES         |





| tablename                 | policyname                                       | cmd    | roles           | using_preview          |
| ------------------------- | ------------------------------------------------ | ------ | --------------- | ---------------------- |
| cars                      | Authenticated users can delete cars              | DELETE | {authenticated} | true                   |
| cars                      | Authenticated users can insert cars              | INSERT | {authenticated} | null                   |
| cars                      | Authenticated users can update cars              | UPDATE | {authenticated} | true                   |
| cars                      | Authenticated users can view cars                | SELECT | {authenticated} | true                   |
| checkins                  | Authenticated users can delete checkins          | DELETE | {authenticated} | true                   |
| checkins                  | Authenticated users can insert checkins          | INSERT | {authenticated} | null                   |
| checkins                  | Authenticated users can update checkins          | UPDATE | {authenticated} | true                   |
| checkins                  | Authenticated users can view checkins            | SELECT | {authenticated} | true                   |
| checkouts                 | Authenticated users can delete checkouts         | DELETE | {authenticated} | true                   |
| checkouts                 | Authenticated users can insert checkouts         | INSERT | {authenticated} | null                   |
| checkouts                 | Authenticated users can update checkouts         | UPDATE | {authenticated} | true                   |
| checkouts                 | Authenticated users can view checkouts           | SELECT | {authenticated} | true                   |
| companies                 | Authenticated users can insert companies         | INSERT | {authenticated} | null                   |
| companies                 | Authenticated users can update companies         | UPDATE | {authenticated} | true                   |
| companies                 | Authenticated users can view companies           | SELECT | {authenticated} | true                   |
| company_setup_credentials | Users can update their own setup credentials     | UPDATE | {authenticated} | (user_id = auth.uid()) |
| company_setup_credentials | Users can view their own setup credentials       | SELECT | {authenticated} | (user_id = auth.uid()) |
| customers                 | Authenticated users can delete customers         | DELETE | {authenticated} | true                   |
| customers                 | Authenticated users can insert customers         | INSERT | {authenticated} | null                   |
| customers                 | Authenticated users can update customers         | UPDATE | {authenticated} | true                   |
| customers                 | Authenticated users can view customers           | SELECT | {authenticated} | true                   |
| part_categories           | Authenticated users can delete part_categories   | DELETE | {authenticated} | true                   |
| part_categories           | Authenticated users can insert part_categories   | INSERT | {authenticated} | null                   |
| part_categories           | Authenticated users can update part_categories   | UPDATE | {authenticated} | true                   |
| part_categories           | Authenticated users can view part_categories     | SELECT | {authenticated} | true                   |
| parts                     | Authenticated users can delete parts             | DELETE | {authenticated} | true                   |
| parts                     | Authenticated users can insert parts             | INSERT | {authenticated} | null                   |
| parts                     | Authenticated users can update parts             | UPDATE | {authenticated} | true                   |
| parts                     | Authenticated users can view parts               | SELECT | {authenticated} | true                   |
| reservations              | Authenticated users can delete reservations      | DELETE | {authenticated} | true                   |
| reservations              | Authenticated users can insert reservations      | INSERT | {authenticated} | null                   |
| reservations              | Authenticated users can update reservations      | UPDATE | {authenticated} | true                   |
| reservations              | Authenticated users can view reservations        | SELECT | {authenticated} | true                   |
| stock_adjustments         | Authenticated users can delete stock_adjustments | DELETE | {authenticated} | true                   |
| stock_adjustments         | Authenticated users can insert stock_adjustments | INSERT | {authenticated} | null                   |
| stock_adjustments         | Authenticated users can update stock_adjustments | UPDATE | {authenticated} | true                   |
| stock_adjustments         | Authenticated users can view stock_adjustments   | SELECT | {authenticated} | true                   |
| stock_entries             | Authenticated users can delete stock_entries     | DELETE | {authenticated} | true                   |
| stock_entries             | Authenticated users can insert stock_entries     | INSERT | {authenticated} | null                   |
| stock_entries             | Authenticated users can update stock_entries     | UPDATE | {authenticated} | true                   |
| stock_entries             | Authenticated users can view stock_entries       | SELECT | {authenticated} | true                   |
| stock_exits               | Authenticated users can delete stock_exits       | DELETE | {authenticated} | true                   |
| stock_exits               | Authenticated users can insert stock_exits       | INSERT | {authenticated} | null                   |
| stock_exits               | Authenticated users can update stock_exits       | UPDATE | {authenticated} | true                   |
| stock_exits               | Authenticated users can view stock_exits         | SELECT | {authenticated} | true                   |
| suppliers                 | Authenticated users can delete suppliers         | DELETE | {authenticated} | true                   |
| suppliers                 | Authenticated users can insert suppliers         | INSERT | {authenticated} | null                   |
| suppliers                 | Authenticated users can update suppliers         | UPDATE | {authenticated} | true                   |
| suppliers                 | Authenticated users can view suppliers           | SELECT | {authenticated} | true                   |
| user_profiles             | Admins can update all user profiles              | UPDATE | {authenticated} | is_admin()             |
| user_profiles             | Admins can view all user profiles                | SELECT | {authenticated} | is_admin()             |
| user_profiles             | Users can insert their own profile               | INSERT | {authenticated} | null                   |
| user_profiles             | Users can update their own profile               | UPDATE | {authenticated} | (user_id = auth.uid()) |
| user_profiles             | Users can view their own profile                 | SELECT | {authenticated} | (user_id = auth.uid()) |