# Como Tornar um Usuário em Admin - Guia Completo

## Problema Comum
Se o SQL não está funcionando, geralmente é por causa de:
1. **RLS (Row Level Security)** bloqueando a atualização
2. **Usuário não existe** na tabela `auth.users`
3. **Perfil não existe** na tabela `user_profiles`
4. **Permissões insuficientes** no SQL Editor

## Solução Passo a Passo

### Método 1: Via Supabase Dashboard (Mais Fácil)

1. **Acesse o Supabase Dashboard**
   - Vá em **Authentication** > **Users**
   - Encontre o usuário pelo email
   - Copie o **User ID** (UUID)

2. **Vá para SQL Editor**
   - Clique em **SQL Editor** no menu lateral
   - Clique em **New Query**

3. **Execute este SQL** (substitua `USER_ID_AQUI` pelo UUID copiado):
   ```sql
   UPDATE public.user_profiles
   SET role = 'admin', is_active = true
   WHERE user_id = 'USER_ID_AQUI';
   ```

4. **Verifique o resultado**:
   ```sql
   SELECT role, is_active, user_id
   FROM public.user_profiles
   WHERE user_id = 'USER_ID_AQUI';
   ```

### Método 2: Usando Função Helper (Recomendado)

Execute este SQL completo no Supabase SQL Editor:

```sql
-- Criar função helper (execute apenas uma vez)
CREATE OR REPLACE FUNCTION public.make_user_admin(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', p_email;
  END IF;
  
  -- Atualizar role para admin
  UPDATE public.user_profiles
  SET role = 'admin', is_active = true
  WHERE user_id = v_user_id;
  
  RETURN TRUE;
END;
$$;

-- Usar a função (substitua o email):
SELECT public.make_user_admin('email@exemplo.com');
```

### Método 3: Verificação Completa

Se ainda não funcionar, execute este script de diagnóstico:

```sql
-- 1. Verificar se usuário existe
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'email@exemplo.com';

-- 2. Verificar se perfil existe
SELECT up.*, au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email = 'email@exemplo.com';

-- 3. Se o perfil não existir, criar manualmente
-- (substitua USER_ID e COMPANY_ID pelos valores corretos)
INSERT INTO public.user_profiles (user_id, company_id, role, is_active)
VALUES (
  'USER_ID_AQUI',
  'COMPANY_ID_AQUI',
  'admin',
  true
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin', is_active = true;

-- 4. Atualizar role
UPDATE public.user_profiles
SET role = 'admin', is_active = true
WHERE user_id = 'USER_ID_AQUI';
```

### Método 4: Via Service Role Key (Avançado)

Se você tem acesso à Service Role Key do Supabase:

```javascript
// Execute em um script Node.js ou no console do navegador
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'SUA_SUPABASE_URL';
const supabaseServiceKey = 'SUA_SERVICE_ROLE_KEY'; // ⚠️ NUNCA exponha isso no frontend

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Buscar user_id pelo email
const { data: users } = await supabase.auth.admin.listUsers();
const user = users.users.find(u => u.email === 'email@exemplo.com');

if (user) {
  // Atualizar perfil
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'admin', is_active: true })
    .eq('user_id', user.id);
  
  console.log(error ? 'Erro:' + error.message : 'Sucesso!');
}
```

## Checklist de Troubleshooting

- [ ] O usuário existe em `auth.users`?
- [ ] O perfil existe em `user_profiles`?
- [ ] O usuário já fez login pelo menos uma vez? (cria o perfil automaticamente)
- [ ] Você está executando como superuser no SQL Editor?
- [ ] O email está correto (case-sensitive)?
- [ ] Você está usando aspas simples no SQL?

## Erros Comuns

### Erro: "permission denied for table user_profiles"
**Solução**: Use a função `make_user_admin()` que usa `SECURITY DEFINER` para bypassar RLS.

### Erro: "no rows updated"
**Solução**: Verifique se o usuário existe e se o perfil foi criado. O usuário precisa fazer login pelo menos uma vez.

### Erro: "user not found"
**Solução**: Verifique o email no Supabase Dashboard > Authentication > Users.

## Verificação Final

Após executar qualquer método, verifique:

```sql
SELECT 
  up.role,
  up.is_active,
  au.email,
  au.id as user_id
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email = 'email@exemplo.com';
```

O resultado deve mostrar:
- `role`: `admin` ou `super_admin`
- `is_active`: `true`
- `email`: o email do usuário

## Próximos Passos

Após tornar o usuário admin:
1. Faça logout e login novamente
2. O link "Funcionários" deve aparecer no sidebar
3. Você poderá gerenciar outros funcionários
