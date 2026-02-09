

A empresa opera uma frota de viaturas de diferentes marcas e modelos (Prado TXL, Land Cruiser V8, Mazda CX9, Pajero, Lexus, Jimny, Swift, i20/Accent, Fortuner, Dzire, entre outros) que necessitam de manutenção regular e reparações ocasionais.

---

## **2. SITUAÇÃO ACTUAL (PROBLEMÁTICA)**

### **2.1. Gestão de Stock Desorganizada**

Actualmente, a empresa possui um inventário de peças e materiais para manutenção e reparação da frota, mas enfrenta os seguintes problemas:

#### **Problema 1: Falta de Estrutura de Dados**
- Tabela de inventário **desorganizada e não normalizada**
- Informações **incompletas** (muitos itens sem preço, sem fornecedor definido)
- **Ausência de códigos únicos** para identificação de peças
- **Dados duplicados** (mesma peça com descrições diferentes)
- **Sem categorização clara** dos materiais

#### **Problema 2: Impossibilidade de Rastreamento**
- **Não há registo de entradas** (quando foi comprado, de quem, por quanto, quem comprou)
- **Não há registo de saídas** (quem usou, em que viatura, quando, para que tipo de manutenção)
- **Impossível saber o histórico** de consumo por viatura
- **Sem controlo de responsabilidades** (quem requisitou vs quem entregou)

#### **Problema 3: Ausência de Controlo Efectivo**
- **Não sabem quanto stock têm realmente** (sistema vs realidade física)
- **Sem alertas de stock mínimo** - descobrem que falta peça quando precisam
- **Não conseguem prever necessidades** de reposição
- **Perdas e desvios não detectados**

#### **Problema 4: Falta de Informação para Gestão**
- **Impossível calcular custos de manutenção** por viatura
- **Não sabem quais peças são mais consumidas**
- **Sem dados para negociar com fornecedores** (volume, frequência)
- **Decisões tomadas "no escuro"** sem dados concretos

---

## **3. IMPACTOS NO NEGÓCIO**

### **3.1. Impactos Operacionais**
- ⏱️ **Tempo perdido** procurando peças ou descobrindo que não há stock
- 🚗 **Viaturas paradas** por falta de peças que pensavam ter
- 🔧 **Manutenções atrasadas** por falta de planeamento
- 📦 **Compras urgentes** (mais caras) por falta de previsão

### **3.2. Impactos Financeiros**
- 💰 **Compras duplicadas** - compram o que já têm mas não sabem onde está
- 📉 **Stock morto** - peças paradas que poderiam estar a ser usadas
- 💸 **Custos ocultos** - não sabem quanto gastam realmente por viatura
- 🔴 **Perdas não detectadas** - desvios, roubos, deterioração

### **3.3. Impactos de Gestão**
- 📊 **Falta de dados** para análise e tomada de decisão
- 🎯 **Impossível definir KPIs** de manutenção
- 👥 **Falta de accountability** - ninguém é responsabilizado
- 📋 **Auditorias difíceis** ou impossíveis

### **3.4. Impactos no Cliente**
- 😞 **Insatisfação** quando viatura não está disponível por estar em manutenção
- ⏰ **Atrasos** nas entregas de viaturas
- 💔 **Perda de confiança** se problemas mecânicos ocorrem frequentemente

---

## **4. NECESSIDADES IDENTIFICADAS**

A empresa precisa de um **sistema de controlo de inventário** que permita:

### **4.1. Organização Básica**
✅ Catalogar todas as peças com códigos únicos  
✅ Categorizar materiais de forma lógica  
✅ Manter informações completas (fornecedor, preço, especificações)  
✅ Localizar peças facilmente no armazém  

### **4.2. Controlo de Movimentações**
✅ Registar **ENTRADAS**: quando compra, de quem, quanto custou, quem comprou  
✅ Registar **SAÍDAS**: quem usou, em que viatura, quando, para que manutenção  
✅ Histórico completo e rastreável de cada peça  
✅ Saber stock actual em tempo real  

### **4.3. Gestão Proactiva**
✅ Alertas de stock mínimo  
✅ Previsão de necessidades de reposição  
✅ Identificação de peças críticas  
✅ Planeamento de compras  

### **4.4. Análise e Relatórios**
✅ Custo de manutenção por viatura  
✅ Consumo por tipo de peça  
✅ Performance de fornecedores  
✅ Análise de tendências  

### **4.5. Controlo e Responsabilização**
✅ Rastreamento de quem requisitou  
✅ Aprovações de saídas (se necessário)  
✅ Controlo de acessos por tipo de utilizador  
✅ Auditoria de todas as operações  

---

## **5. RESTRIÇÕES E REQUISITOS**

### **5.1. Utilizadores do Sistema**
- **Gestores de Stock** - controlam entradas e saídas
- **Compradores** - registam compras
- **Mecânicos** - requisitam peças
- **Administrativos** - geram relatórios
- **Gestão** - análise e decisões estratégicas

### **5.2. Requisitos Técnicos**
- Sistema deve ser **multi-utilizador**
- Acesso **simultâneo** sem conflitos
- **Interface simples** e intuitiva (nem todos são técnicos)
- Possibilidade de **acesso mobile** (mecânicos no terreno)
- **Relatórios exportáveis** (PDF, Excel)

### **5.3. Requisitos de Dados**
- **Integridade** - evitar duplicações e inconsistências
- **Rastreabilidade** - auditoria completa
- **Backup** - segurança dos dados
- **Escalabilidade** - crescimento futuro

---

## **6. RESULTADO ESPERADO**

Com a implementação do sistema adequado, a empresa espera:

### **Curto Prazo (1-3 meses)**
✅ Inventário completo e organizado  
✅ Controlo básico de entradas e saídas  
✅ Redução de compras duplicadas  
✅ Menos tempo perdido procurando peças  

### **Médio Prazo (3-6 meses)**
✅ Redução de 30-40% em custos de manutenção não planeada  
✅ Melhor negociação com fornecedores (dados de volume)  
✅ Viaturas menos tempo paradas  
✅ Planeamento de manutenções mais eficiente  

### **Longo Prazo (6-12 meses)**
✅ Análise preditiva de necessidades  
✅ Optimização de stock (nem excesso, nem falta)  
✅ Decisões baseadas em dados concretos  
✅ ROI mensurável do sistema  

---

## **7. CRITICIDADE DO PROBLEMA**

**🔴 ALTA PRIORIDADE**

Este problema afecta directamente:
- **Rentabilidade** da empresa
- **Qualidade do serviço** ao cliente
- **Eficiência operacional**
- **Competitividade** no mercado

A falta de controlo pode resultar em:
- Perdas financeiras significativas
- Perda de clientes
- Custos operacionais excessivos
- Impossibilidade de escalar o negócio

---

## **8. CONCLUSÃO**

A empresa possui os **materiais** mas não possui o **sistema** para geri-los eficientemente. 

**A solução passa por:**
1. ✅ Normalizar e estruturar os dados existentes
2. ✅ Implementar sistema de controlo de inventário
3. ✅ Treinar equipa no uso do sistema
4. ✅ Estabelecer processos de entrada/saída
5. ✅ Monitorizar e ajustar continuamente

# 📊 ESTRUTURA FINAL DA TABELA NORMALIZADA

## **MODELO DE DADOS COMPLETO - RENT A CAR INVENTORY SYSTEM**

---

## **TABELA 1: Fornecedores**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Fornecedor** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Codigo_Fornecedor** | VARCHAR(20) | UNIQUE, NOT NULL | Ex: FORN001, FORN002 |
| **Nome_Fornecedor** | VARCHAR(100) | NOT NULL | GondonAfrica, Luanda da Sorte |
| **Nome_Contacto** | VARCHAR(100) | NULL | Nome da pessoa de contacto |
| **Telefone** | VARCHAR(20) | NULL | +244 923 456 789 |
| **Email** | VARCHAR(100) | NULL | contacto@fornecedor.ao |
| **Endereco** | TEXT | NULL | Morada completa |
| **NIF** | VARCHAR(30) | NULL | Número de Identificação Fiscal |
| **Observacoes** | TEXT | NULL | Notas adicionais |
| **Ativo** | BOOLEAN | DEFAULT TRUE | Fornecedor activo? |
| **Data_Cadastro** | DATETIME | DEFAULT NOW() | Quando foi cadastrado |
| **Criado_Por** | INT | FK → Funcionarios | Quem cadastrou |

**Índices:**
- PRIMARY KEY (ID_Fornecedor)
- UNIQUE INDEX (Codigo_Fornecedor)
- INDEX (Nome_Fornecedor)

---

## **TABELA 2: Categorias**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Categoria** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Codigo_Categoria** | VARCHAR(10) | UNIQUE, NOT NULL | TRV, MOT, ELE, LUB, FIL |
| **Nome_Categoria** | VARCHAR(50) | NOT NULL | Travões, Motor, Elétrico |
| **Descricao** | TEXT | NULL | Descrição detalhada |
| **Cor_Identificacao** | VARCHAR(7) | NULL | Código hex para UI (#FF5733) |
| **Ordem_Exibicao** | INT | DEFAULT 0 | Ordem para listagens |
| **Ativo** | BOOLEAN | DEFAULT TRUE | Categoria activa? |

**Índices:**
- PRIMARY KEY (ID_Categoria)
- UNIQUE INDEX (Codigo_Categoria)

---

## **TABELA 3: Pecas (Catálogo de Peças)**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Peca** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Codigo_Peca** | VARCHAR(30) | UNIQUE, NOT NULL | TRV-PRADO-001 |
| **Nome_Peca** | VARCHAR(100) | NOT NULL | Calço de travão frente |
| **Descricao_Completa** | TEXT | NULL | Descrição detalhada |
| **ID_Categoria** | INT | FK → Categorias, NOT NULL | Categoria da peça |
| **Referencia_Modelo** | VARCHAR(100) | NULL | Prado TXL, Mazda CX9 |
| **Codigo_Fabricante** | VARCHAR(50) | NULL | Código original do fabricante |
| **Unidade_Medida** | VARCHAR(10) | NOT NULL | un, L, kg, conj, rolo, jogo |
| **Stock_Minimo** | DECIMAL(10,2) | DEFAULT 0 | Alertar quando menor |
| **Stock_Maximo** | DECIMAL(10,2) | NULL | Stock ideal máximo |
| **Ponto_Reposicao** | DECIMAL(10,2) | NULL | Quando pedir mais |
| **Localizacao_Armazem** | VARCHAR(50) | NULL | Prateleira A1, Sector B |
| **Preco_Medio** | DECIMAL(15,2) | DEFAULT 0 | Calculado automaticamente |
| **Imagem_URL** | VARCHAR(255) | NULL | Caminho para foto |
| **Codigo_Barras** | VARCHAR(50) | NULL | Para leitura por scanner |
| **Observacoes** | TEXT | NULL | Notas importantes |
| **Ativo** | BOOLEAN | DEFAULT TRUE | Peça activa no catálogo? |
| **Data_Cadastro** | DATETIME | DEFAULT NOW() | Quando foi cadastrada |
| **Criado_Por** | INT | FK → Funcionarios | Quem cadastrou |
| **Ultima_Atualizacao** | DATETIME | ON UPDATE NOW() | Última modificação |

**Índices:**
- PRIMARY KEY (ID_Peca)
- UNIQUE INDEX (Codigo_Peca)
- INDEX (ID_Categoria)
- INDEX (Nome_Peca)
- INDEX (Referencia_Modelo)
- INDEX (Codigo_Barras)

---

## **TABELA 4: Funcionarios**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Funcionario** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Codigo_Funcionario** | VARCHAR(20) | UNIQUE, NOT NULL | FUNC001, FUNC002 |
| **Nome_Completo** | VARCHAR(100) | NOT NULL | Nome do funcionário |
| **Cargo** | VARCHAR(50) | NULL | Mecânico, Gestor Stock |
| **Departamento** | VARCHAR(50) | NULL | Manutenção, Compras |
| **Telefone** | VARCHAR(20) | NULL | +244 923 456 789 |
| **Email** | VARCHAR(100) | NULL | funcionario@empresa.ao |
| **Username** | VARCHAR(50) | UNIQUE, NOT NULL | Para login no sistema |
| **Password_Hash** | VARCHAR(255) | NOT NULL | Senha encriptada |
| **Nivel_Permissao** | ENUM | NOT NULL | Admin, Gestor, Operador, Consulta |
| **Ativo** | BOOLEAN | DEFAULT TRUE | Funcionário activo? |
| **Data_Admissao** | DATE | NULL | Data de entrada na empresa |
| **Data_Cadastro** | DATETIME | DEFAULT NOW() | Registo no sistema |

**Valores ENUM Nivel_Permissao:**
- 'ADMIN' - Acesso total
- 'GESTOR' - Gestão de stock
- 'COMPRADOR' - Registar compras
- 'MECANICO' - Requisitar peças
- 'CONSULTA' - Apenas visualização

**Índices:**
- PRIMARY KEY (ID_Funcionario)
- UNIQUE INDEX (Codigo_Funcionario)
- UNIQUE INDEX (Username)
- INDEX (Nome_Completo)

---

## **TABELA 5: Viaturas**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Viatura** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Matricula** | VARCHAR(20) | UNIQUE, NOT NULL | LD-12-34-AB |
| **Marca** | VARCHAR(50) | NOT NULL | Toyota, Mazda, Suzuki |
| **Modelo** | VARCHAR(50) | NOT NULL | Prado TXL, CX9, Jimny |
| **Ano** | INT | NULL | 2020, 2021 |
| **Chassis** | VARCHAR(50) | UNIQUE, NULL | Número do chassis |
| **Cor** | VARCHAR(30) | NULL | Branco, Preto, Cinza |
| **Kilometragem_Atual** | DECIMAL(10,2) | DEFAULT 0 | Km actual |
| **Tipo_Combustivel** | VARCHAR(20) | NULL | Gasolina, Diesel |
| **Status** | ENUM | NOT NULL | Disponível, Manutenção, Alugado |
| **Observacoes** | TEXT | NULL | Notas sobre a viatura |
| **Ativo** | BOOLEAN | DEFAULT TRUE | Viatura activa na frota? |
| **Data_Cadastro** | DATETIME | DEFAULT NOW() | Registo no sistema |

**Valores ENUM Status:**
- 'DISPONIVEL'
- 'EM_MANUTENCAO'
- 'ALUGADO'
- 'INATIVO'

**Índices:**
- PRIMARY KEY (ID_Viatura)
- UNIQUE INDEX (Matricula)
- UNIQUE INDEX (Chassis)
- INDEX (Marca, Modelo)

---

## **TABELA 6: Entradas (Compras)**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Entrada** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Numero_Nota_Entrada** | VARCHAR(30) | UNIQUE, NOT NULL | ENT-2026-0001 |
| **Data_Entrada** | DATE | NOT NULL | Data da compra/recepção |
| **Hora_Entrada** | TIME | DEFAULT NOW() | Hora do registo |
| **ID_Fornecedor** | INT | FK → Fornecedores, NOT NULL | Quem vendeu |
| **ID_Peca** | INT | FK → Pecas, NOT NULL | Qual peça |
| **Quantidade** | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Quantidade comprada |
| **Preco_Unitario** | DECIMAL(15,2) | NOT NULL, CHECK >= 0 | Preço por unidade (Kz) |
| **Preco_Total** | DECIMAL(15,2) | GENERATED | Qtd × Preço Unit. |
| **Numero_Fatura** | VARCHAR(50) | NULL | Nº da fatura do fornecedor |
| **Data_Fatura** | DATE | NULL | Data da fatura |
| **ID_Comprador** | INT | FK → Funcionarios, NOT NULL | Quem comprou |
| **Documento_Anexo** | VARCHAR(255) | NULL | Caminho do PDF/foto |
| **Observacoes** | TEXT | NULL | Notas sobre a compra |
| **Status** | ENUM | DEFAULT 'CONFIRMADO' | Status da entrada |
| **Data_Registro** | DATETIME | DEFAULT NOW() | Quando foi registado |
| **Registrado_Por** | INT | FK → Funcionarios | Quem registou no sistema |

**Valores ENUM Status:**
- 'PENDENTE' - Aguardando confirmação
- 'CONFIRMADO' - Entrada confirmada
- 'CANCELADO' - Entrada cancelada

**Índices:**
- PRIMARY KEY (ID_Entrada)
- UNIQUE INDEX (Numero_Nota_Entrada)
- INDEX (Data_Entrada)
- INDEX (ID_Fornecedor)
- INDEX (ID_Peca)
- INDEX (ID_Comprador)

**Trigger:** Ao inserir entrada confirmada → actualizar stock

---

## **TABELA 7: Saidas (Utilizações/Requisições)**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Saida** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Numero_Requisicao** | VARCHAR(30) | UNIQUE, NOT NULL | SAI-2026-0001 |
| **Data_Saida** | DATE | NOT NULL | Data da requisição |
| **Hora_Saida** | TIME | DEFAULT NOW() | Hora da saída |
| **ID_Peca** | INT | FK → Pecas, NOT NULL | Qual peça |
| **Quantidade** | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Quantidade retirada |
| **ID_Viatura** | INT | FK → Viaturas, NULL | Para qual viatura (pode ser NULL) |
| **Kilometragem_Viatura** | DECIMAL(10,2) | NULL | Km no momento da manutenção |
| **ID_Solicitante** | INT | FK → Funcionarios, NOT NULL | Quem pediu/usou |
| **ID_Responsavel_Entrega** | INT | FK → Funcionarios, NOT NULL | Quem entregou do stock |
| **Tipo_Saida** | ENUM | NOT NULL | Tipo de utilização |
| **Motivo_Detalhado** | TEXT | NULL | Descrição do problema/manutenção |
| **Numero_Ordem_Servico** | VARCHAR(50) | NULL | Nº da OS de manutenção |
| **ID_Aprovador** | INT | FK → Funcionarios, NULL | Quem aprovou (se necessário) |
| **Data_Aprovacao** | DATETIME | NULL | Quando foi aprovado |
| **Status** | ENUM | DEFAULT 'PENDENTE' | Status da requisição |
| **Observacoes** | TEXT | NULL | Notas adicionais |
| **Data_Registro** | DATETIME | DEFAULT NOW() | Quando foi registado |

**Valores ENUM Tipo_Saida:**
- 'MANUTENCAO_PREVENTIVA'
- 'MANUTENCAO_CORRETIVA'
- 'REPARACAO_URGENTE'
- 'USO_INTERNO'
- 'TESTE'
- 'OUTROS'

**Valores ENUM Status:**
- 'PENDENTE' - Aguardando aprovação
- 'APROVADO' - Aprovado mas não entregue
- 'ENTREGUE' - Peça já entregue
- 'CANCELADO' - Requisição cancelada

**Índices:**
- PRIMARY KEY (ID_Saida)
- UNIQUE INDEX (Numero_Requisicao)
- INDEX (Data_Saida)
- INDEX (ID_Peca)
- INDEX (ID_Viatura)
- INDEX (ID_Solicitante)
- INDEX (Status)

**Trigger:** Ao inserir saída entregue → actualizar stock

---

## **TABELA 8: Movimentacoes (Histórico Completo)**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Movimentacao** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Data_Hora** | DATETIME | DEFAULT NOW() | Timestamp da movimentação |
| **Tipo_Movimentacao** | ENUM | NOT NULL | Entrada, Saída, Ajuste, Devolução |
| **ID_Peca** | INT | FK → Pecas, NOT NULL | Qual peça movimentou |
| **Quantidade** | DECIMAL(10,2) | NOT NULL | Qtd (+ ou -) |
| **ID_Referencia** | INT | NULL | ID da Entrada/Saída/Ajuste |
| **Tipo_Referencia** | VARCHAR(20) | NULL | 'ENTRADA', 'SAIDA', 'AJUSTE' |
| **Stock_Anterior** | DECIMAL(10,2) | NOT NULL | Stock antes da movimentação |
| **Stock_Novo** | DECIMAL(10,2) | NOT NULL | Stock após movimentação |
| **ID_Usuario** | INT | FK → Funcionarios, NOT NULL | Quem fez a operação |
| **Observacoes** | TEXT | NULL | Detalhes da movimentação |

**Valores ENUM Tipo_Movimentacao:**
- 'ENTRADA' - Compra de fornecedor
- 'SAIDA' - Utilização/requisição
- 'AJUSTE' - Correção de inventário
- 'DEVOLUCAO' - Retorno ao stock
- 'TRANSFERENCIA' - Entre locais

**Índices:**
- PRIMARY KEY (ID_Movimentacao)
- INDEX (Data_Hora)
- INDEX (ID_Peca)
- INDEX (Tipo_Movimentacao)
- INDEX (ID_Referencia, Tipo_Referencia)

**IMPORTANTE:** Esta tabela é **append-only** (apenas adiciona), nunca deleta registos.

---

## **TABELA 9: Ajustes_Inventario**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Ajuste** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Numero_Ajuste** | VARCHAR(30) | UNIQUE, NOT NULL | AJU-2026-0001 |
| **Data_Ajuste** | DATE | NOT NULL | Data do ajuste |
| **Hora_Ajuste** | TIME | DEFAULT NOW() | Hora do ajuste |
| **ID_Peca** | INT | FK → Pecas, NOT NULL | Qual peça |
| **Stock_Sistema** | DECIMAL(10,2) | NOT NULL | Stock no sistema antes |
| **Stock_Fisico** | DECIMAL(10,2) | NOT NULL | Stock contado fisicamente |
| **Diferenca** | DECIMAL(10,2) | GENERATED | Stock_Fisico - Stock_Sistema |
| **Motivo** | ENUM | NOT NULL | Razão do ajuste |
| **Descricao_Motivo** | TEXT | NULL | Detalhes do motivo |
| **ID_Responsavel** | INT | FK → Funcionarios, NOT NULL | Quem fez a contagem |
| **ID_Aprovador** | INT | FK → Funcionarios, NULL | Quem aprovou o ajuste |
| **Data_Aprovacao** | DATETIME | NULL | Quando foi aprovado |
| **Status** | ENUM | DEFAULT 'PENDENTE' | Status do ajuste |
| **Documento_Anexo** | VARCHAR(255) | NULL | Foto/relatório |
| **Observacoes** | TEXT | NULL | Notas adicionais |
| **Data_Registro** | DATETIME | DEFAULT NOW() | Quando foi registado |

**Valores ENUM Motivo:**
- 'PERDA' - Peça perdida
- 'ROUBO' - Possível roubo
- 'DANO' - Peça danificada
- 'ERRO_REGISTRO' - Erro de registo anterior
- 'CONTAGEM_FISICA' - Inventário geral
- 'EXPIRACAO' - Peça expirada/vencida
- 'OUTROS'

**Valores ENUM Status:**
- 'PENDENTE' - Aguardando aprovação
- 'APROVADO' - Ajuste aprovado e aplicado
- 'REJEITADO' - Ajuste rejeitado

**Índices:**
- PRIMARY KEY (ID_Ajuste)
- UNIQUE INDEX (Numero_Ajuste)
- INDEX (Data_Ajuste)
- INDEX (ID_Peca)
- INDEX (Status)

**Trigger:** Ao aprovar ajuste → actualizar stock e criar movimentação

---

## **TABELA 10: Stock_Atual (VIEW - Calculada)**

**ESTA É UMA VIEW, NÃO UMA TABELA FÍSICA**

```sql
CREATE VIEW Stock_Atual AS
SELECT 
    p.ID_Peca,
    p.Codigo_Peca,
    p.Nome_Peca,
    p.Referencia_Modelo,
    c.Nome_Categoria,
    p.Unidade_Medida,
    p.Stock_Minimo,
    p.Stock_Maximo,
    p.Ponto_Reposicao,
    p.Localizacao_Armazem,
    
    -- Total de Entradas
    COALESCE(SUM(e.Quantidade), 0) AS Total_Entradas,
    
    -- Total de Saídas
    COALESCE(SUM(s.Quantidade), 0) AS Total_Saidas,
    
    -- Stock Actual
    (COALESCE(SUM(e.Quantidade), 0) - COALESCE(SUM(s.Quantidade), 0)) AS Stock_Atual,
    
    -- Status do Stock
    CASE 
        WHEN (COALESCE(SUM(e.Quantidade), 0) - COALESCE(SUM(s.Quantidade), 0)) <= 0 
            THEN 'ESGOTADO'
        WHEN (COALESCE(SUM(e.Quantidade), 0) - COALESCE(SUM(s.Quantidade), 0)) < p.Stock_Minimo 
            THEN 'CRITICO'
        WHEN (COALESCE(SUM(e.Quantidade), 0) - COALESCE(SUM(s.Quantidade), 0)) <= p.Ponto_Reposicao 
            THEN 'BAIXO'
        WHEN p.Stock_Maximo IS NOT NULL 
            AND (COALESCE(SUM(e.Quantidade), 0) - COALESCE(SUM(s.Quantidade), 0)) > p.Stock_Maximo 
            THEN 'EXCESSO'
        ELSE 'OK'
    END AS Status_Stock,
    
    -- Preço Médio
    p.Preco_Medio,
    
    -- Valor Total em Stock
    (COALESCE(SUM(e.Quantidade), 0) - COALESCE(SUM(s.Quantidade), 0)) * p.Preco_Medio AS Valor_Total_Stock,
    
    -- Última Entrada
    MAX(e.Data_Entrada) AS Ultima_Entrada,
    
    -- Última Saída
    MAX(s.Data_Saida) AS Ultima_Saida
    
FROM Pecas p
LEFT JOIN Categorias c ON p.ID_Categoria = c.ID_Categoria
LEFT JOIN Entradas e ON p.ID_Peca = e.ID_Peca AND e.Status = 'CONFIRMADO'
LEFT JOIN Saidas s ON p.ID_Peca = s.ID_Peca AND s.Status = 'ENTREGUE'
WHERE p.Ativo = TRUE
GROUP BY p.ID_Peca
```

**Campos da VIEW:**
- ID_Peca
- Codigo_Peca
- Nome_Peca
- Referencia_Modelo
- Nome_Categoria
- Unidade_Medida
- Stock_Minimo
- Stock_Maximo
- Ponto_Reposicao
- Localizacao_Armazem
- Total_Entradas
- Total_Saidas
- Stock_Atual
- Status_Stock (ESGOTADO, CRITICO, BAIXO, OK, EXCESSO)
- Preco_Medio
- Valor_Total_Stock
- Ultima_Entrada
- Ultima_Saida

---

## **TABELA 11: Logs_Sistema (Auditoria)**

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| **ID_Log** | INT | PK, AUTO_INCREMENT | Identificador único |
| **Data_Hora** | DATETIME | DEFAULT NOW() | Timestamp da acção |
| **ID_Usuario** | INT | FK → Funcionarios | Quem fez a acção |
| **Tabela_Afetada** | VARCHAR(50) | NOT NULL | Qual tabela foi alterada |
| **ID_Registro** | INT | NULL | ID do registo afectado |
| **Acao** | ENUM | NOT NULL | INSERT, UPDATE, DELETE |
| **Dados_Anteriores** | JSON | NULL | Dados antes da alteração |
| **Dados_Novos** | JSON | NULL | Dados após alteração |
| **IP_Address** | VARCHAR(45) | NULL | IP do usuário |
| **User_Agent** | VARCHAR(255) | NULL | Navegador/dispositivo |

**Valores ENUM Acao:**
- 'INSERT' - Criação de registo
- 'UPDATE' - Alteração de registo
- 'DELETE' - Eliminação de registo
- 'LOGIN' - Login no sistema
- 'LOGOUT' - Logout do sistema

**Índices:**
- PRIMARY KEY (ID_Log)
- INDEX (Data_Hora)
- INDEX (ID_Usuario)
- INDEX (Tabela_Afetada)

---

## **📊 RELACIONAMENTOS (FOREIGN KEYS)**

```
Fornecedores (1) ────→ (N) Entradas
Categorias (1) ──────→ (N) Pecas
Pecas (1) ───────────→ (N) Entradas
Pecas (1) ───────────→ (N) Saidas
Pecas (1) ───────────→ (N) Movimentacoes
Pecas (1) ───────────→ (N) Ajustes_Inventario
Funcionarios (1) ────→ (N) Entradas [comprador]
Funcionarios (1) ────→ (N) Entradas [registrado_por]
Funcionarios (1) ────→ (N) Saidas [solicitante]
Funcionarios (1) ────→ (N) Saidas [responsavel_entrega]
Funcionarios (1) ────→ (N) Saidas [aprovador]
Funcionarios (1) ────→ (N) Movimentacoes [usuario]
Funcionarios (1) ────→ (N) Ajustes_Inventario [responsavel]
Funcionarios (1) ────→ (N) Ajustes_Inventario [aprovador]
Funcionarios (1) ────→ (N) Logs_Sistema
Viaturas (1) ────────→ (N) Saidas
```

---

## **🔧 TRIGGERS NECESSÁRIOS**

### **Trigger 1: Actualizar Stock após Entrada Confirmada**
```sql
CREATE TRIGGER atualizar_stock_entrada
AFTER INSERT ON Entradas
FOR EACH ROW
WHEN (NEW.Status = 'CONFIRMADO')
BEGIN
    INSERT INTO Movimentacoes (
        Tipo_Movimentacao,
        ID_Peca,
        Quantidade,
        ID_Referencia,
        Tipo_Referencia,
        Stock_Anterior,
        Stock_Novo,
        ID_Usuario
    ) VALUES (
        'ENTRADA',
        NEW.ID_Peca,
        NEW.Quantidade,
        NEW.ID_Entrada,
        'ENTRADA',
        (SELECT Stock_Atual FROM Stock_Atual WHERE ID_Peca = NEW.ID_Peca),
        (SELECT Stock_Atual FROM Stock_Atual WHERE ID_Peca = NEW.ID_Peca) + NEW.Quantidade,
        NEW.Registrado_Por
    );
END;
```

### **Trigger 2: Actualizar Stock após Saída Entregue**
```sql
CREATE TRIGGER atualizar_stock_saida
AFTER UPDATE ON Saidas
FOR EACH ROW
WHEN (NEW.Status = 'ENTREGUE' AND OLD.Status != 'ENTREGUE')
BEGIN
    INSERT INTO Movimentacoes (
        Tipo_Movimentacao,
        ID_Peca,
        Quantidade,
        ID_Referencia,
        Tipo_Referencia,
        Stock_Anterior,
        Stock_Novo,
        ID_Usuario
    ) VALUES (
        'SAIDA',
        NEW.ID_Peca,
        -NEW.Quantidade,
        NEW.ID_Saida,
        'SAIDA',
        (SELECT Stock_Atual FROM Stock_Atual WHERE ID_Peca = NEW.ID_Peca),
        (SELECT Stock_Atual FROM Stock_Atual WHERE ID_Peca = NEW.ID_Peca) - NEW.Quantidade,
        NEW.ID_Responsavel_Entrega
    );
END;
```

### **Trigger 3: Actualizar Preço Médio após Entrada**
```sql
CREATE TRIGGER atualizar_preco_medio
AFTER INSERT ON Entradas
FOR EACH ROW
WHEN (NEW.Status = 'CONFIRMADO')
BEGIN
    UPDATE Pecas
    SET Preco_Medio = (
        SELECT AVG(Preco_Unitario)
        FROM Entradas
        WHERE ID_Peca = NEW.ID_Peca
          AND Status = 'CONFIRMADO'
    )
    WHERE ID_Peca = NEW.ID_Peca;
END;
```

### **Trigger 4: Registar Ajuste de Inventário**
```sql
CREATE TRIGGER aplicar_ajuste_inventario
AFTER UPDATE ON Ajustes_Inventario
FOR EACH ROW
WHEN (NEW.Status = 'APROVADO' AND OLD.Status = 'PENDENTE')
BEGIN
    INSERT INTO Movimentacoes (
        Tipo_Movimentacao,
        ID_Peca,
        Quantidade,
        ID_Referencia,
        Tipo_Referencia,
        Stock_Anterior,
        Stock_Novo,
        ID_Usuario
    ) VALUES (
        'AJUSTE',
        NEW.ID_Peca,
        NEW.Diferenca,
        NEW.ID_Ajuste,
        'AJUSTE',
        NEW.Stock_Sistema,
        NEW.Stock_Fisico,
        NEW.ID_Aprovador
    );
END;
```

---

## **📈 ÍNDICES ADICIONAIS PARA PERFORMANCE**

```sql
-- Índices compostos para queries frequentes
CREATE INDEX idx_entradas_peca_data ON Entradas(ID_Peca, Data_Entrada);
CREATE INDEX idx_saidas_peca_data ON Saidas(ID_Peca, Data_Saida);
CREATE INDEX idx_saidas_viatura_data ON Saidas(ID_Viatura, Data_Saida);
CREATE INDEX idx_movimentacoes_peca_data ON Movimentacoes(ID_Peca, Data_Hora);

-- Índices para relatórios
CREATE INDEX idx_entradas_fornecedor_data ON Entradas(ID_Fornecedor, Data_Entrada);
CREATE INDEX idx_saidas_solicitante ON Saidas(ID_Solicitante);
CREATE INDEX idx_saidas_tipo ON Saidas(Tipo_Saida);
```

---

## **🎯 CONSTRAINTS ADICIONAIS**

```sql
-- Garantir que quantidade em saídas não exceda stock
ALTER TABLE Saidas ADD CONSTRAINT check_stock_disponivel
CHECK (
    Quantidade <= (
        SELECT Stock_Atual 
        FROM Stock_Atual 
        WHERE ID_Peca = Saidas.ID_Peca
    )
);

-- Garantir que preços não sejam negativos
ALTER TABLE Entradas ADD CONSTRAINT check_preco_positivo
CHECK (Preco_Unitario >= 0);

-- Garantir datas lógicas
ALTER TABLE Saidas ADD CONSTRAINT check_data_aprovacao
CHECK (Data_Aprovacao IS NULL OR Data_Aprovacao >= Data_Saida);
```

---

## **✅ RESUMO DA ESTRUTURA**

**11 Tabelas Principais:**
1. ✅ Fornecedores (cadastro de fornecedores)
2. ✅ Categorias (classificação de peças)
3. ✅ Pecas (catálogo completo)
4. ✅ Funcionarios (utilizadores do sistema)
5. ✅ Viaturas (frota da empresa)
6. ✅ Entradas (compras e recepções)
7. ✅ Saidas (requisições e utilizações)
8. ✅ Movimentacoes (histórico completo)
9. ✅ Ajustes_Inventario (correções de stock)
10. ✅ Stock_Atual (VIEW calculada)
11. ✅ Logs_Sistema (auditoria)

**Features Implementadas:**
- ✅ Rastreabilidade completa (quem, quando, onde, porquê)
- ✅ Controlo de aprovações
- ✅ Histórico imutável
- ✅ Cálculo automático de stock
- ✅ Alertas de stock mínimo
- ✅ Auditoria de todas operações
- ✅ Múltiplos níveis de acesso
- ✅ Integridade referencial

---

**Esta estrutura está completa e pronta para implementação!** 

Quer que eu:
1. Crie os scripts SQL completos?
2. Faça um diagrama ER (Entity-Relationship)?
3. Monte exemplos de dados para teste?