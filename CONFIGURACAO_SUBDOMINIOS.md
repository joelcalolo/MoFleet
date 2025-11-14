# Configuração de Subdomínios - MoFleet

Este guia explica como configurar subdomínios dinâmicos para o sistema MoFleet, permitindo que cada empresa tenha seu próprio subdomínio (ex: `empresa1.mofleet.com`).

## 📋 Pré-requisitos

- Domínio registrado no GoDaddy (ex: `mofleet.com`)
- Projeto deployado na Vercel
- Acesso ao painel do GoDaddy
- Acesso ao painel da Vercel

---

## 🔧 Parte 1: Configuração na Vercel

### Passo 1: Adicionar Domínio Principal

1. Acesse o painel da Vercel: https://vercel.com
2. Selecione seu projeto **MoFleet**
3. Vá em **Settings** → **Domains**
4. Clique em **Add Domain**
5. Digite seu domínio principal: `mofleet.com`
6. Clique em **Add**

### Passo 2: Adicionar Subdomínio Wildcard

1. Ainda na página **Domains**, clique em **Add Domain** novamente
2. Digite: `*.mofleet.com` (com o asterisco)
3. Clique em **Add**
4. A Vercel irá mostrar instruções de configuração DNS

### Passo 3: Obter Informações de DNS da Vercel

Após adicionar os domínios, a Vercel mostrará algo como:

```
Para mofleet.com:
Type: A
Name: @
Value: 76.76.21.21

Para *.mofleet.com:
Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

**⚠️ IMPORTANTE:** Anote esses valores, você precisará deles no GoDaddy!

---

## 🌐 Parte 2: Configuração no GoDaddy

### Passo 1: Acessar o Gerenciador de DNS

1. Acesse: https://www.godaddy.com
2. Faça login na sua conta
3. Vá em **Meus Produtos** → **DNS** (ou **Gerenciar DNS**)
4. Selecione o domínio `mofleet.com`
5. Clique em **Gerenciar DNS** ou **DNS**

### Passo 2: Configurar Registro A para Domínio Principal

1. Na seção **Registros**, encontre ou adicione um registro do tipo **A**
2. Se já existir um registro A para `@` (ou vazio), edite-o
3. Se não existir, clique em **Adicionar** ou **+**
4. Configure:
   - **Tipo:** A
   - **Nome:** `@` (ou deixe em branco/vazio)
   - **Valor:** `76.76.21.21` (use o IP fornecido pela Vercel)
   - **TTL:** 600 (ou o padrão)
5. Clique em **Salvar**

### Passo 3: Configurar CNAME para Subdomínios Wildcard

1. Na seção **Registros**, clique em **Adicionar** ou **+**
2. Configure:
   - **Tipo:** CNAME
   - **Nome:** `*` (asterisco)
   - **Valor:** `cname.vercel-dns.com` (use o valor fornecido pela Vercel)
   - **TTL:** 600 (ou o padrão)
3. Clique em **Salvar**

### Passo 4: Verificar Configuração

Sua lista de registros DNS deve ter algo como:

```
Tipo    Nome    Valor                    TTL
A       @       76.76.21.21              600
CNAME   *       cname.vercel-dns.com     600
```

---

## ⏱️ Propagação DNS

Após configurar os registros DNS:

1. **Tempo de propagação:** 5 minutos a 48 horas (geralmente 15-30 minutos)
2. **Verificar propagação:** Use ferramentas como:
   - https://dnschecker.org
   - https://www.whatsmydns.net
3. **Teste no terminal:**
   ```bash
   # Verificar registro A
   nslookup mofleet.com
   
   # Verificar CNAME wildcard
   nslookup *.mofleet.com
   ```

---

## ✅ Verificação na Vercel

1. Volte para a Vercel → **Settings** → **Domains**
2. Aguarde até que ambos os domínios mostrem status **Valid Configuration** (✓ verde)
3. Se aparecer erro, verifique:
   - Se os registros DNS estão corretos no GoDaddy
   - Se passou tempo suficiente para propagação (pode levar até 48h)

---

## 🧪 Teste de Funcionamento

### Teste 1: Domínio Principal

1. Acesse: `https://mofleet.com`
2. Deve carregar a aplicação normalmente

### Teste 2: Subdomínio Wildcard

1. Acesse: `https://teste.mofleet.com` (ou qualquer subdomain)
2. Deve carregar a aplicação
3. O sistema detectará automaticamente o subdomain `teste`

### Teste 3: Login com Company User

1. Acesse o subdomain de uma empresa (ex: `empresa1.mofleet.com`)
2. Vá em **Login** → **Usuário da Empresa**
3. O campo "Código da Empresa" deve estar preenchido automaticamente com `empresa1`
4. Faça login com username e senha do company user

---

## 🔍 Troubleshooting

### Problema: Domínio não está funcionando

**Soluções:**
1. Verifique se os registros DNS estão corretos no GoDaddy
2. Aguarde mais tempo para propagação (até 48h)
3. Limpe o cache do DNS no seu computador:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   ```

### Problema: Vercel mostra "Invalid Configuration"

**Soluções:**
1. Verifique se o registro CNAME está como `*` (asterisco) e não como `*.mofleet.com`
2. Verifique se o valor do CNAME está correto (ex: `cname.vercel-dns.com`)
3. Aguarde a propagação DNS completar

### Problema: Subdomain não detecta automaticamente

**Soluções:**
1. Verifique se está acessando via HTTPS
2. Verifique se o subdomain está configurado na tabela `companies` no Supabase
3. Verifique os logs do navegador (F12) para erros

### Problema: Erro "Código da empresa, username ou senha incorretos"

**Soluções:**
1. Verifique se o subdomain na tabela `companies` corresponde ao subdomain na URL
2. Verifique se o username e senha estão corretos
3. Verifique se o company_user está ativo (`is_active = true`)

---

## 📝 Notas Importantes

1. **Subdomínios são gerados automaticamente** quando uma nova empresa é criada
2. **O subdomain é baseado no nome da empresa**, removendo acentos e caracteres especiais
3. **Se houver conflito**, o sistema adiciona um número (ex: `empresa-1`, `empresa-2`)
4. **Em desenvolvimento local** (localhost), o subdomain não será detectado automaticamente - será necessário preencher manualmente

---

## 🎯 Exemplo Completo

### Cenário: Empresa "RentCar Angola"

1. **Criação da empresa:**
   - Nome: "RentCar Angola"
   - Subdomain gerado: `rentcar-angola`
   - URL: `https://rentcar-angola.mofleet.com`

2. **Criação de Company User:**
   - Username: `joao.silva`
   - Senha: `senha123`
   - Role: `gerente`

3. **Login:**
   - Acessa: `https://rentcar-angola.mofleet.com`
   - Clica em "Usuário da Empresa"
   - Campo "Código da Empresa" já preenchido: `rentcar-angola`
   - Digita username: `joao.silva`
   - Digita senha: `senha123`
   - Clica em "Entrar"

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs da Vercel
2. Verifique os logs do Supabase
3. Verifique o console do navegador (F12)
4. Consulte a documentação da Vercel: https://vercel.com/docs/concepts/projects/domains
5. Consulte a documentação do GoDaddy: https://www.godaddy.com/help

---

## ✅ Checklist Final

- [ ] Domínio principal adicionado na Vercel
- [ ] Subdomain wildcard (`*.mofleet.com`) adicionado na Vercel
- [ ] Registro A configurado no GoDaddy para `@`
- [ ] Registro CNAME configurado no GoDaddy para `*`
- [ ] Ambos os domínios mostram "Valid Configuration" na Vercel
- [ ] Domínio principal funciona (`https://mofleet.com`)
- [ ] Subdomain de teste funciona (`https://teste.mofleet.com`)
- [ ] Login de company user funciona com subdomain

---

**Última atualização:** Janeiro 2025

