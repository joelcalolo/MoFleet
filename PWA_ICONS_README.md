# Ícones PWA

Para completar a configuração do PWA, você precisa adicionar os ícones da aplicação.

## Tamanhos Necessários

1. **icon-192x192.png** - 192x192 pixels
2. **icon-512x512.png** - 512x512 pixels

## Como Criar os Ícones

### Opção 1: Usar Ferramenta Online
1. Acesse [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Faça upload de uma imagem (recomendado: 512x512 ou maior)
3. Baixe os ícones gerados
4. Coloque os arquivos na pasta `public/`:
   - `public/icon-192x192.png`
   - `public/icon-512x512.png`

### Opção 2: Criar Manualmente
1. Crie uma imagem quadrada (512x512 pixels recomendado)
2. Use um editor de imagens (Photoshop, GIMP, Figma, etc.)
3. Exporte em dois tamanhos:
   - 192x192 pixels → `public/icon-192x192.png`
   - 512x512 pixels → `public/icon-512x512.png`

### Opção 3: Usar Placeholder Temporário
Se você não tem os ícones ainda, pode usar um gerador de placeholder:
- [Placeholder.com](https://via.placeholder.com/512)
- Ou criar um ícone simples com texto "RC" (RentaCar)

## Características dos Ícones

- **Formato**: PNG
- **Fundo**: Pode ser transparente ou sólido
- **Cores**: Use cores que combinem com o tema da aplicação (#667eea)
- **Design**: Simples e reconhecível, pois aparecerá pequeno em alguns contextos

## Verificação

Após adicionar os ícones, verifique:
1. Os arquivos estão em `public/icon-192x192.png` e `public/icon-512x512.png`
2. O `manifest.json` referencia corretamente os ícones
3. Teste instalando o PWA no dispositivo móvel

