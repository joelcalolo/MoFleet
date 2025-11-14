# 🚀 Guia Rápido - Configuração DNS

## 📍 Vercel (5 minutos)

### 1. Adicionar Domínios
```
Settings → Domains → Add Domain
```
- Adicione: `mofleet.com`
- Adicione: `*.mofleet.com`

### 2. Anotar Valores
A Vercel mostrará algo como:
```
A       @       76.76.21.21
CNAME   *       cname.vercel-dns.com
```

---

## 🌐 GoDaddy (5 minutos)

### 1. Acessar DNS
```
Meus Produtos → DNS → Gerenciar DNS
```

### 2. Adicionar Registro A
```
Tipo: A
Nome: @
Valor: 76.76.21.21 (use o IP da Vercel)
```

### 3. Adicionar Registro CNAME
```
Tipo: CNAME
Nome: *
Valor: cname.vercel-dns.com (use o valor da Vercel)
```

### 4. Salvar e Aguardar
⏱️ Aguarde 15-30 minutos para propagação

---

## ✅ Verificar

1. Vercel → Domains → Deve mostrar ✓ verde
2. Teste: `https://teste.mofleet.com` deve funcionar

---

## 🆘 Problemas?

- **Não funciona?** Aguarde até 48h para propagação completa
- **Erro na Vercel?** Verifique se os registros estão exatamente como mostrado acima
- **Subdomain não detecta?** Verifique se está usando HTTPS

---

**📖 Documentação completa:** Veja `CONFIGURACAO_SUBDOMINIOS.md`

