# Corrigir Erro 404 em Arquivos JavaScript (Assets)

## Problema

Você está recebendo o erro:
```
GET https://www.mofleet.online/assets/index-B_xn681L.js net::ERR_ABORTED 404 (Not Found)
```

Este erro significa que o navegador está tentando carregar um arquivo JavaScript que não existe no servidor.

## Causas Possíveis

### 1. **Build Desatualizado ou Incompleto**
O arquivo JavaScript não foi gerado corretamente durante o build, ou o build falhou.

### 2. **Deploy Incompleto**
Os arquivos não foram enviados completamente para o servidor.

### 3. **Cache do Navegador**
O navegador está usando uma versão antiga do HTML que referencia um arquivo JavaScript que não existe mais.

### 4. **Configuração do Servidor**
O servidor não está servindo arquivos da pasta `/assets/` corretamente.

### 5. **Problema com vercel.json**
A configuração do Vercel pode estar bloqueando arquivos estáticos.

## Soluções

### Solução 1: Limpar Cache e Fazer Hard Refresh

**No Navegador:**
1. Pressione `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac) para fazer hard refresh
2. Ou abra as DevTools (F12) → aba Network → marque "Disable cache" → recarregue a página

**Se ainda não funcionar:**
1. Limpe o cache do navegador completamente
2. Feche e abra o navegador novamente

---

### Solução 2: Verificar e Fazer Novo Build

**1. Verifique se o build está funcionando localmente:**

```bash
# Limpar build anterior
rm -rf dist

# Fazer novo build
npm run build

# Verificar se os arquivos foram gerados
ls -la dist/assets/
```

**2. Verifique se os arquivos estão na pasta `dist/assets/`:**
- Deve haver arquivos como `index-XXXXX.js` e `index-XXXXX.css`
- Se não houver, o build falhou

**3. Teste localmente:**
```bash
npm run preview
```
Acesse `http://localhost:4173` e verifique se a aplicação carrega corretamente.

---

### Solução 3: Verificar Configuração do Vercel

O arquivo `vercel.json` atual já está configurado para não bloquear arquivos estáticos:

```json
{
  "rewrites": [
    {
      "source": "/((?!.*\\..*|sw\\.js|manifest\\.json).*)",
      "destination": "/index.html"
    }
  ]
}
```

Esta configuração:
- ✅ Permite arquivos com extensão (`.js`, `.css`, `.png`, etc.) serem servidos normalmente
- ✅ Redireciona apenas rotas sem extensão para `index.html`

**Se você modificou o `vercel.json`, certifique-se de que ele não está bloqueando arquivos estáticos.**

---

### Solução 4: Fazer Novo Deploy

**Se estiver usando Vercel:**

1. **Via Git (Recomendado):**
   ```bash
   git add .
   git commit -m "Fix: Rebuild application"
   git push
   ```
   O Vercel fará deploy automaticamente.

2. **Via Vercel Dashboard:**
   - Acesse o dashboard do Vercel
   - Vá em seu projeto
   - Clique em "Redeploy" → "Redeploy"

**Se estiver usando outro serviço:**
- Faça um novo build e faça upload dos arquivos da pasta `dist/` novamente

---

### Solução 5: Verificar Estrutura de Arquivos no Servidor

**Se você tem acesso ao servidor, verifique:**

1. **Os arquivos estão na pasta correta?**
   - Deve haver uma pasta `assets/` com os arquivos `.js` e `.css`
   - O `index.html` deve estar na raiz

2. **As permissões estão corretas?**
   ```bash
   chmod -R 755 dist/
   ```

3. **O servidor está configurado para servir arquivos estáticos?**
   - Verifique a configuração do Nginx/Apache
   - Certifique-se de que arquivos `.js` e `.css` são servidos com os MIME types corretos

---

### Solução 6: Verificar Logs do Servidor

**No Vercel:**
1. Acesse o dashboard
2. Vá em "Deployments"
3. Clique no deploy mais recente
4. Verifique os logs para ver se há erros durante o build

**Em outros serviços:**
- Verifique os logs de build e deploy
- Procure por erros relacionados a arquivos não encontrados

---

## Diagnóstico Rápido

Execute estes passos na ordem:

1. ✅ **Hard refresh no navegador** (`Ctrl + Shift + R`)
2. ✅ **Verificar se o build funciona localmente** (`npm run build`)
3. ✅ **Verificar se os arquivos estão em `dist/assets/`**
4. ✅ **Fazer novo deploy**
5. ✅ **Verificar logs do servidor**

---

## Configuração Adicional do Vite (Se Necessário)

Se o problema persistir, você pode adicionar configurações específicas no `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Garantir que os assets sejam gerados corretamente
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Manter nomes de arquivo consistentes
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
}));
```

---

## Verificação Final

Após aplicar as soluções:

1. ✅ Faça um novo build: `npm run build`
2. ✅ Verifique se `dist/assets/` contém os arquivos `.js`
3. ✅ Faça deploy novamente
4. ✅ Limpe o cache do navegador
5. ✅ Acesse o site e verifique se o erro desapareceu

---

## Se o Problema Persistir

1. **Verifique o console do navegador** para outros erros
2. **Verifique a aba Network** no DevTools para ver quais arquivos estão falhando
3. **Compare o hash do arquivo** no HTML com o que está no servidor
4. **Verifique se há problemas de CORS** ou outras políticas de segurança
5. **Entre em contato com o suporte** da sua plataforma de hosting

---

## Nota Importante

O hash no nome do arquivo (`index-B_xn681L.js`) é gerado automaticamente pelo Vite para cache busting. Cada build gera um novo hash. Se o HTML estiver referenciando um hash antigo, significa que:
- O HTML não foi atualizado no servidor, OU
- O navegador está usando uma versão em cache do HTML

Sempre faça hard refresh após um novo deploy!

