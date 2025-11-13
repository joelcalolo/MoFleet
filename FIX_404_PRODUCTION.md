# Corrigir Erro 404 em Produção

## Problema

Quando você acessa uma rota diretamente em produção (ex: `https://seudominio.com/dashboard`), recebe um erro 404. Isso acontece porque o servidor tenta procurar um arquivo físico nesse caminho, mas em uma SPA (Single Page Application), todas as rotas são gerenciadas pelo JavaScript no cliente.

## Solução

O servidor precisa ser configurado para redirecionar todas as requisições para o `index.html`, permitindo que o React Router gerencie as rotas.

## Configuração por Plataforma

### 1. Vercel

Se você está usando **Vercel**, o arquivo `vercel.json` já foi criado na raiz do projeto. Ele redireciona todas as rotas para `index.html`.

**Arquivo criado:** `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Como aplicar:**
1. Faça commit do arquivo `vercel.json`
2. Faça push para o repositório
3. O Vercel aplicará automaticamente na próxima deploy

---

### 2. Netlify

Se você está usando **Netlify**, dois arquivos foram criados:

**Opção A: `netlify.toml`** (na raiz do projeto)
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Opção B: `public/_redirects`** (na pasta public - será copiado para o build)
```
/*    /index.html   200
```

**Como aplicar:**
1. Faça commit do arquivo `netlify.toml` ou `public/_redirects`
2. Faça push para o repositório
3. O Netlify aplicará automaticamente na próxima deploy

---

### 3. Apache

Se você está usando um servidor **Apache**, o arquivo `.htaccess` foi criado na pasta `public`.

**Arquivo criado:** `public/.htaccess`

**Como aplicar:**
1. O arquivo será copiado automaticamente para o build quando você fizer `npm run build`
2. Certifique-se de que o módulo `mod_rewrite` está habilitado no Apache
3. Faça deploy do build

**Para habilitar mod_rewrite no Apache:**
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

### 4. Nginx

Se você está usando **Nginx**, adicione esta configuração no seu arquivo de configuração do site:

```nginx
server {
    listen 80;
    server_name seudominio.com;
    root /var/www/seudominio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Como aplicar:**
1. Edite o arquivo de configuração do Nginx (geralmente em `/etc/nginx/sites-available/seudominio`)
2. Adicione a configuração acima
3. Teste a configuração: `sudo nginx -t`
4. Recarregue o Nginx: `sudo systemctl reload nginx`

---

### 5. Cloudflare Pages

Se você está usando **Cloudflare Pages**, crie um arquivo `_redirects` na pasta `public`:

**Arquivo criado:** `public/_redirects`
```
/*    /index.html   200
```

**Como aplicar:**
1. Faça commit do arquivo
2. Faça push para o repositório
3. O Cloudflare Pages aplicará automaticamente

---

### 6. GitHub Pages

Se você está usando **GitHub Pages**, você precisa adicionar um script de build que cria um arquivo `404.html` que redireciona para `index.html`.

**Adicione ao `package.json`:**
```json
{
  "scripts": {
    "build": "vite build && cp dist/index.html dist/404.html"
  }
}
```

Ou crie um arquivo `404.html` manualmente na pasta `dist` após o build.

---

### 7. Outras Plataformas

Para outras plataformas, geralmente você precisa:

1. **Configurar um fallback para `index.html`** em todas as rotas
2. **Garantir que arquivos estáticos** (CSS, JS, imagens) sejam servidos normalmente
3. **Redirecionar todas as outras requisições** para `index.html`

---

## Verificação

Após aplicar a configuração:

1. Faça um novo deploy
2. Acesse uma rota diretamente (ex: `https://seudominio.com/dashboard`)
3. A página deve carregar corretamente, não mais 404

---

## Troubleshooting

### Ainda recebendo 404?

1. **Verifique se o arquivo foi commitado e enviado** para o repositório
2. **Verifique se fez um novo deploy** após adicionar o arquivo
3. **Limpe o cache do navegador** (Ctrl+Shift+R ou Cmd+Shift+R)
4. **Verifique os logs do servidor** para ver se há erros

### Arquivos estáticos não carregam?

Certifique-se de que a configuração permite que arquivos estáticos sejam servidos normalmente. As configurações acima já fazem isso automaticamente.

---

## Nota Importante

- O arquivo `vercel.json` funciona apenas no Vercel
- O arquivo `netlify.toml` funciona apenas no Netlify
- O arquivo `public/_redirects` funciona no Netlify e Cloudflare Pages
- O arquivo `public/.htaccess` funciona apenas no Apache
- Para Nginx, você precisa editar manualmente a configuração do servidor

**Identifique qual plataforma você está usando e aplique a configuração correspondente.**

