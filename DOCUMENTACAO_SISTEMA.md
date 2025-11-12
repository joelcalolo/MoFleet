# Documentação do Sistema de Gestão de Alugueres de Carros

## 📋 Visão Geral

Sistema completo de gestão de alugueres de veículos desenvolvido para empresas de aluguer de carros. O sistema permite gerenciar frotas, clientes, reservas, saídas e retornos de veículos, além de fornecer relatórios e dashboards analíticos.

## 🎯 Funcionalidades Principais

### 1. **Dashboard**
- Visão geral do negócio com estatísticas em tempo real
- Calendário de reservas integrado
- Alertas de reservas próximas (3 dias antes)
- Alertas de carros prestes a retornar
- Estatísticas de receita, carros disponíveis, clientes ativos, etc.

### 2. **Gestão de Carros**
- Cadastro completo de veículos (marca, modelo, matrícula, tipo, etc.)
- Controle de disponibilidade (disponível/indisponível)
- Informações de preço, caução e taxas
- Filtros e busca de carros

### 3. **Gestão de Clientes**
- Cadastro de clientes com informações de contacto
- Histórico de reservas por cliente
- Gestão de dados pessoais e de contacto

### 4. **Reservas**
- **Calendário Visual**: Visualização mensal de todas as reservas com cores por carro
- **Lista de Reservas**: Lista completa com filtros e busca
- **Criação/Edição**: Formulário completo para criar e editar reservas
- **Prevenção de Sobremarcação**: Sistema impede reservas sobrepostas para o mesmo carro
- **Detalhes da Reserva**: Página dedicada com todas as informações e exportação em PDF
- **Campo "Criado Por"**: Registro de quem fez cada reserva
- **Status**: Pendente, Confirmada, Em Andamento, Concluída, Cancelada

### 5. **Frota (Checkout/Checkin)**
- **Registro de Saída (Checkout)**:
  - Associação com reserva
  - Quilometragem inicial
  - Campo "Quem entregou"
  - Observações
  - Marca carro como indisponível automaticamente

- **Registro de Retorno (Checkin)**:
  - Quilometragem final
  - Cálculo automático de quilometragem percorrida
  - Controle de caução devolvida (sim/não e valor)
  - Multas e taxas extras
  - Campo "Quem recebeu"
  - Observações
  - Marca carro como disponível automaticamente

- **Lista de Carros Fora**: Visualização de todos os veículos atualmente em aluguer

### 6. **Resumo de Alugueres**
- Lista completa de todos os alugueres (checkouts e checkins)
- Filtros por:
  - Status (Em Andamento, Completo)
  - Período (data inicial e final)
  - Carro (busca por matrícula/nome)
  - Cliente (busca por nome)
- Exportação:
  - **CSV**: Para análise em Excel/Google Sheets
  - **PDF**: Relatório formatado com filtros aplicados
- Informações detalhadas:
  - Datas de saída e retorno
  - Quilometragem inicial e final
  - Quilometragem percorrida
  - Caução devolvida
  - Multas e taxas extras
  - Observações

### 7. **Agenda**
- Visualização de reservas em formato de agenda
- Navegação por períodos

### 8. **Configurações**
- Gestão de dados da empresa
- Nome da empresa
- Email de contacto
- Redefinição de senha (via Supabase Auth)

## 🏢 Sistema Multi-Empresas

O sistema suporta múltiplas empresas, onde:
- Cada usuário pertence a uma empresa
- Dados são isolados por empresa (carros, clientes, reservas)
- Cada empresa tem suas próprias configurações
- Criação de empresa durante o cadastro de usuário

## 🔐 Autenticação e Segurança

- **Autenticação via Supabase Auth**
- **Confirmação de Email**: Usuários recebem email para confirmar conta
- **Redefinição de Senha**: Funcionalidade integrada
- **Row Level Security (RLS)**: Isolamento de dados por empresa no banco de dados
- **Proteção de Rotas**: Apenas usuários autenticados acessam o sistema

## 💰 Moeda e Formatação

- **Moeda**: Todos os valores são exibidos em **AKZ** (Kwanza Angolano)
- **Formatação de Datas**: Adaptada para o fuso horário de Angola (WAT - West Africa Time)
- **Formatação de Números**: Valores monetários formatados com 2 casas decimais

## 📊 Relatórios e Exportação

### Exportação PDF
- Disponível em:
  - Detalhes de Reserva
  - Detalhes de Aluguer
  - Resumo de Alugueres (com filtros aplicados)
- Formato profissional e imprimível
- Inclui todas as informações relevantes

### Exportação CSV
- Disponível em Resumo de Alugueres
- Compatível com Excel e Google Sheets
- Inclui todos os dados filtrados

## 🎨 Interface do Usuário

- **Design Moderno**: Interface limpa e intuitiva
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Componentes Shadcn UI**: Biblioteca de componentes moderna
- **Tema Escuro/Claro**: Suporte a temas (se configurado)
- **Navegação Intuitiva**: Menu lateral com acesso rápido a todas as funcionalidades

## 📱 Páginas do Sistema

1. **Landing Page** (`/`): Página inicial pública
2. **Autenticação** (`/auth`): Login e cadastro
3. **Confirmação de Email** (`/auth/confirm`): Página informativa após cadastro
4. **Dashboard** (`/dashboard`): Painel principal
5. **Carros** (`/cars`): Gestão de veículos
6. **Clientes** (`/customers`): Gestão de clientes
7. **Reservas** (`/reservations`): Gestão de reservas
8. **Agenda** (`/schedule`): Visualização em agenda
9. **Frota** (`/fleet`): Checkout e checkin de veículos
10. **Resumo de Alugueres** (`/rentals-summary`): Histórico completo
11. **Detalhes de Aluguer** (`/rental/:id`): Detalhes de um aluguer específico
12. **Detalhes de Reserva** (`/reservation/:id`): Detalhes de uma reserva específica
13. **Configurações** (`/settings`): Configurações da empresa

## 🔔 Sistema de Alertas

- **Alertas de Reservas Próximas**: 
  - Aparecem 3 dias antes da data de início
  - Exibidos no dashboard
  - Notificações push (se configurado)

- **Alertas de Retorno de Carros**:
  - Carros prestes a retornar (3 dias antes)
  - Lista de carros atualmente fora
  - Exibidos no dashboard

## 🚗 Fluxo de Trabalho Típico

1. **Cadastro de Carro**: Adicionar veículo à frota
2. **Cadastro de Cliente**: Registrar novo cliente
3. **Criar Reserva**: Cliente reserva carro para período específico
4. **Checkout**: Quando cliente retira o carro
   - Registrar quilometragem inicial
   - Marcar carro como indisponível
5. **Checkin**: Quando cliente devolve o carro
   - Registrar quilometragem final
   - Verificar caução, multas, taxas
   - Marcar carro como disponível
6. **Relatórios**: Gerar relatórios e análises

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript
- **Roteamento**: React Router DOM
- **UI**: Shadcn UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL com Row Level Security
- **Build**: Vite
- **Gerenciamento de Estado**: React Hooks + TanStack Query

## 📦 Estrutura do Projeto

```
rental/
├── src/
│   ├── pages/          # Páginas principais
│   ├── components/     # Componentes reutilizáveis
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários
│   └── integrations/   # Integrações (Supabase)
├── supabase/
│   └── migrations/     # Migrações do banco de dados
└── public/             # Arquivos estáticos
```

## 🔄 Validações e Regras de Negócio

- **Prevenção de Sobremarcação**: Não permite reservas sobrepostas para o mesmo carro
- **Validação de Datas**: Data de fim deve ser posterior à data de início
- **Cálculo Automático**: Total da reserva calculado automaticamente
- **Status de Disponibilidade**: Carro marcado automaticamente como indisponível no checkout
- **Filtros de Reservas**: Reservas com checkin completo não aparecem no calendário ativo

## 📝 Notas Importantes

- O sistema usa o fuso horário de Angola (WAT)
- Todos os valores monetários são em AKZ
- O sistema é multi-empresa com isolamento completo de dados
- Exportações PDF usam a funcionalidade de impressão do navegador
- O calendário mostra apenas reservas ativas (sem checkin completo)

## 🚀 Como Começar

1. Fazer login ou criar conta
2. Criar empresa (se novo usuário)
3. Adicionar carros à frota
4. Cadastrar clientes
5. Começar a criar reservas

---

**Versão**: 1.0  
**Última Atualização**: Janeiro 2025

