# Correção de Erros em Produção

## Erros Identificados e Soluções

### 1. Erro de MIME Type ao Carregar Módulos JavaScript

**Erro:**
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"
```

**Causa:**
O `vercel.json` estava reescrevendo TODAS as requisições para `/index.html`, incluindo arquivos JavaScript e outros recursos estáticos. Quando o navegador tentava carregar um arquivo `.js`, recebia HTML em vez do JavaScript.

**Solução:**
Ajustado o `vercel.json` para usar uma regex que exclui arquivos com extensões (como `.js`, `.css`, `.png`, etc.) do rewrite. Agora apenas rotas sem extensão são reescritas para `index.html`.

**Arquivo corrigido:** `vercel.json`

---

### 2. Erro de Ícone do Manifest

**Erro:**
```
Error while trying to use the following icon from the Manifest: https://www.mofleet.online/icon-192x192.png (Download error or resource isn't a valid image)
```

**Causa:**
O `manifest.json` estava referenciando ícones (`/icon-192x192.png` e `/icon-512x512.png`) que não existiam na pasta `public`. Apenas `/logo.png` existe.

**Solução:**
Atualizado o `manifest.json` para usar `/logo.png` em vez dos ícones inexistentes. Também atualizado o `sw.js` para referenciar o logo correto.

**Arquivos corrigidos:**
- `public/manifest.json`
- `public/sw.js`

---

### 3. Erro do Service Worker com chrome-extension

**Erro:**
```
Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Request scheme 'chrome-extension' is unsupported
```

**Causa:**
O Service Worker estava tentando fazer cache de requisições com scheme `chrome-extension:`, que não é suportado pela API Cache. Isso acontece quando extensões do Chrome fazem requisições que são interceptadas pelo Service Worker.

**Solução:**
Adicionada verificação no Service Worker para ignorar requisições que não começam com `http` ou `https`. Agora o Service Worker verifica se a URL começa com `http` antes de tentar fazer cache.

**Arquivo corrigido:** `public/sw.js`

---

## Resumo das Alterações

1. **vercel.json**: Regex ajustada para não reescrever arquivos estáticos
2. **public/manifest.json**: Ícones atualizados para usar `/logo.png`
3. **public/sw.js**: 
   - Verificação para ignorar requisições não-HTTP(S)
   - Referências de ícones atualizadas para `/logo.png`
   - Tratamento de erros melhorado no cache

## Próximos Passos

Após fazer o deploy dessas alterações:

1. Limpar o cache do navegador
2. Desregistrar o Service Worker antigo (se necessário):
   - Abrir DevTools > Application > Service Workers
   - Clicar em "Unregister"
3. Recarregar a página
4. Verificar se os erros foram resolvidos

## Nota

Se você quiser criar ícones específicos para PWA (192x192 e 512x512), você pode:
1. Criar os arquivos `icon-192x192.png` e `icon-512x512.png` na pasta `public`
2. Atualizar o `manifest.json` para usar esses ícones específicos
3. Atualizar o `sw.js` para incluir esses ícones no cache

