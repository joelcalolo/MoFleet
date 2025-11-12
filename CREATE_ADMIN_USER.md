# Como Criar o Usuário Admin Inicial

Este documento explica como criar o usuário administrador inicial do sistema.

## Credenciais Iniciais

- **Email**: admin@mail.com
- **Senha**: senha123
- **Role**: super_admin
- **2FA**: Será configurado após o primeiro login

## Método 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard do seu projeto
2. Vá em **Authentication** > **Users**
3. Clique em **Add User** > **Create New User**
4. Preencha:
   - **Email**: admin@mail.com
   - **Password**: senha123
   - **Auto Confirm User**: ✅ (marcar)
5. Clique em **Create User**

6. Após criar o usuário, copie o **User ID** (UUID)

7. Execute no SQL Editor do Supabase:

```sql
-- Substitua 'USER_ID_AQUI' pelo UUID do usuário criado
UPDATE public.user_profiles 
SET 
  role = 'super_admin',
  must_change_password = true,
  is_active = true
WHERE user_id = 'USER_ID_AQUI';

-- Se o perfil não existir, crie primeiro uma empresa e depois o perfil
INSERT INTO public.companies (name, email)
VALUES ('Sistema Administrativo', 'admin@mail.com')
ON CONFLICT DO NOTHING
RETURNING id;

-- Depois crie o perfil (substitua COMPANY_ID e USER_ID)
INSERT INTO public.user_profiles (user_id, company_id, role, must_change_password, is_active)
VALUES (
  'USER_ID_AQUI',
  (SELECT id FROM public.companies WHERE email = 'admin@mail.com' LIMIT 1),
  'super_admin',
  true,
  true
)
ON CONFLICT (user_id) DO UPDATE
SET 
  role = 'super_admin',
  must_change_password = true,
  is_active = true;
```

## Método 2: Via SQL Direto (Avançado)

⚠️ **Atenção**: Este método requer acesso direto ao banco de dados.

```sql
-- 1. Criar empresa
INSERT INTO public.companies (name, email)
VALUES ('Sistema Administrativo', 'admin@mail.com')
RETURNING id;

-- 2. Criar usuário no auth.users (requer permissões especiais)
-- NOTA: Normalmente isso é feito via Supabase Auth API ou Dashboard
-- O hash da senha precisa ser gerado corretamente

-- 3. Após criar o usuário, atualizar o perfil
UPDATE public.user_profiles 
SET 
  role = 'super_admin',
  must_change_password = true,
  is_active = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@mail.com');
```

## Método 3: Via API (Programático)

Você pode criar um script Node.js para criar o usuário:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'SUA_SUPABASE_URL';
const supabaseServiceKey = 'SUA_SERVICE_ROLE_KEY'; // ⚠️ Use apenas em ambiente seguro

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  // 1. Criar usuário
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@mail.com',
    password: 'senha123',
    email_confirm: true,
  });

  if (authError) {
    console.error('Erro ao criar usuário:', authError);
    return;
  }

  // 2. Criar empresa
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .insert({ name: 'Sistema Administrativo', email: 'admin@mail.com' })
    .select()
    .single();

  if (companyError) {
    console.error('Erro ao criar empresa:', companyError);
    return;
  }

  // 3. Criar perfil
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      company_id: companyData.id,
      role: 'super_admin',
      must_change_password: true,
      is_active: true,
    });

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError);
    return;
  }

  console.log('Usuário admin criado com sucesso!');
}

createAdminUser();
```

## Configurar Autenticação de 2 Fatores (2FA)

Após o primeiro login e redefinição de senha:

1. O usuário será redirecionado para o dashboard
2. Para habilitar 2FA, vá em **Configurações** > **Segurança**
3. Clique em **Habilitar Autenticação de 2 Fatores**
4. Escaneie o QR code com um app autenticador (Google Authenticator, Authy, etc.)
5. Digite o código de verificação

## Primeiro Login

1. Acesse a aplicação
2. Faça login com:
   - Email: admin@mail.com
   - Senha: senha123
3. Você será redirecionado para a página de redefinição obrigatória
4. Defina um novo email e senha
5. Após salvar, você será redirecionado para o dashboard
6. O menu "Admin" aparecerá na barra lateral

## Verificação

Para verificar se o usuário foi criado corretamente:

```sql
SELECT 
  up.id,
  up.role,
  up.is_active,
  up.must_change_password,
  au.email,
  c.name as company_name
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
LEFT JOIN public.companies c ON c.id = up.company_id
WHERE au.email = 'admin@mail.com';
```

O resultado deve mostrar:
- `role`: super_admin
- `is_active`: true
- `must_change_password`: true

## Troubleshooting

### Usuário não consegue fazer login
- Verifique se o email está correto
- Verifique se o usuário está ativo (`is_active = true`)
- Verifique se o email foi confirmado no Supabase Auth

### Menu Admin não aparece
- Verifique se o role está como `super_admin`
- Verifique se `is_active = true`
- Faça logout e login novamente

### Erro ao atualizar senha
- Verifique se a senha tem pelo menos 6 caracteres
- Verifique se as senhas coincidem
- Verifique os logs do console do navegador

