# TRABALHO PRÁTICO: BANCO DE DADOS NOSQL COM MONGODB
**Instituto Federal de Santa Catarina (IFSC) – Câmpus Gaspar**  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS)  
**Disciplina:** Banco de Dados / NoSQL  
**Professor:** Marcos Rodrigo Momo  
**Tema Escolhido:** Sistema de Gestão Bancária e Contas Financeiras  
**Coleções Utilizadas:** `Clientes`, `Contas`, `Transacoes`, `Emprestimos`  

---

## SUMÁRIO
1. [Parte 1: Conceitos e Fundamentos NoSQL](#parte-1-conceitos-e-fundamentos-nosql)
   - [Questão 1: Incompatibilidade de Impedância e Orientação a Agregados](#questão-1)
   - [Questão 2: Persistência Poliglota](#questão-2)
2. [Parte 2: Preparação do Ambiente e Operações CRUD](#parte-2-preparação-do-ambiente-e-operações-crud)
   - [2.1 Inserção de Dados (insertOne)](#21-inserção-de-dados-insertone)
   - [2.2 Atualização com Incremental (updateOne, $set e $inc)](#22-atualização-com-incremental-updateone-set-e-inc)
   - [2.3 Manipulação de Arrays ($addToSet)](#23-manipulação-de-arrays-addtoset)
   - [2.4 Remoção de Registros (deleteMany)](#24-remoção-de-registros-deletemany)
3. [Parte 3: Consultas Simples e Avançadas (find)](#parte-3-consultas-simples-e-avançadas-find)
   - [3.1 Projeção e Ordenação](#31-projeção-e-ordenação)
   - [3.2 Paginação (skip e limit)](#32-paginação-skip-e-limit)
   - [3.3 Operadores de Comparação e Datas ($gt)](#33-operadores-de-comparação-e-datas-gt)
   - [3.4 Operadores Lógicos e de Conjunto ($in)](#34-operadores-lógicos-e-de-conjunto-in)
   - [3.5 Operadores de Elemento ($exists)](#35-operadores-de-elemento-exists)
   - [3.6 Busca por Padrão de Texto ($regex)](#36-busca-por-padrão-de-texto-regex)
4. [Parte 4: Processamento Avançado de Dados (aggregate)](#parte-4-processamento-avançado-de-dados-aggregate)
   - [4.1 Agrupamento e Métricas Financeiras ($group)](#41-agrupamento-e-métricas-financeiras-group)
   - [4.2 Desconstrução de Arrays e Contagem ($unwind e $sortByCount)](#42-desconstrução-de-arrays-e-contagem-unwind-e-sortbycount)
   - [4.3 Filtragem e Agregação Combinada ($match e $group)](#43-filtragem-e-agregação-combinada-match-e-group)
   - [4.4 Junção entre Coleções ($lookup e $project)](#44-junção-entre-coleções-lookup-e-project)
5. [Documentação da Aplicação Bancária (Tema do Sistema)](#documentação-da-aplicação-bancária)
6. [Guia de Captura de Telas (Prints para Entrega)](#guia-de-captura-de-telas)

---

<div style="page-break-after: always;"></div>

# PARTE 1: Conceitos e Fundamentos NoSQL

## Questão 1
> **Diferencie o modelo relacional tradicional (SGBDR) do modelo orientado a documentos do MongoDB. Em sua resposta:**
> - *Explique o conceito de Incompatibilidade de Impedância (diferença entre o modelo relacional em tabelas e as estruturas de dados em memória principal).*
> - *Explique como a orientação a agregados (subdocumentos e arrays) facilita o desenvolvimento de aplicações modernamente estruturadas.*

### 1. Diferenciação Estrutural
Os Sistemas Gerenciadores de Bancos de Dados Relacionais (SGBDR) estruturam as informações em tabelas bidimensionais rígidas compostas por linhas (tuplas) e colunas (atributos). A integridade e a ausência de redundâncias são asseguradas por meio da normalização formal (Formas Normais - 1FN, 2FN, 3FN), exigindo que entidades complexas do mundo real sejam fragmentadas em dezenas de tabelas correlacionadas através de chaves primárias e estrangeiras (`JOINs`).

Por outro lado, o **MongoDB** adota o modelo orientado a documentos BSON (*Binary JSON*). Em vez de decompor arbitrariamente uma entidade em múltiplas tabelas, o documento armazena dados correlacionados juntos, permitindo esquemas dinâmicos (*schema-flexible*), tipos ricos de dados e aninhamento estruturado.

### 2. Incompatibilidade de Impedância (*Object-Relational Impedance Mismatch*)
A incompatibilidade de impedância é a dissonância paradigmática entre:
- **O modelo de objetos em memória principal:** linguagens modernas orientadas a objetos (como Java, TypeScript, C#, Python) organizam as informações como grafos de objetos ricos, classes hierárquicas, coleções polimórficas, listas e mapas compostos por referência direta.
- **O modelo relacional em disco:** bancos relacionais operam estritamente sobre relações matemáticas planas e tipos escalares atômicos.

Para transpor essa barreira, arquiteturas relacionais necessitam de camadas complexas de mapeamento objeto-relacional (ORMs como Hibernate, EF Core ou Prisma). Essas camadas introduzem custos severos de processamento, complexidade de manutenção e problemas clássicos de desempenho, como o problema de consultas *N+1* e múltiplos `JOINs` custosos para remontar uma única entidade de domínio.

### 3. Orientação a Agregados (Subdocumentos e Arrays)
O conceito de Agregado (*DDD - Domain-Driven Design*) estabelece que um conjunto de objetos intimamente ligados deve ser tratado como uma unidade atômica de persistência. O modelo do MongoDB adapta-se perfeitamente a essa orientação por meio de:
- **Subdocumentos aninhados:** propriedades dependentes (como o endereço de um cliente ou os dados contratuais de uma transação) são salvas diretamente no documento pai.
- **Arrays nativos:** listas de valores e listas de documentos (como os seguros contratados `["seguro de vida", "seguro para carro"]` ou a lista de dependentes) são armazenadas diretamente sem necessidade de tabelas associativas intermediárias.

**Benefícios diretos no desenvolvimento moderno:**
- **Leitura em Operação Única:** Toda a árvore do agregado é recuperada com uma única leitura de disco (`find` por chave), eliminando `JOINs`.
- **Atomicidade Natural:** Alterações dentro do mesmo documento são atômicas em nível de documento, reduzindo o overhead de transações distribuídas.
- **Isomorfismo de Dados:** A estrutura trafegada na rede via JSON (em APIs REST/GraphQL) é idêntica à estrutura manipulada na memória e à forma persistida no disco pelo MongoDB.

---

## Questão 2
> **O que é Persistência Poliglota? Explique por que uma arquitetura de software moderna pode optar por utilizar MongoDB para determinadas funcionalidades (como catálogo de produtos ou carrinho) e outros bancos de dados (como relacional ou chave-valor) para etapas distintas do sistema.**

### 1. Definição de Persistência Poliglota
Persistência Poliglota (*Polyglot Persistence*) é a prática arquitetural de empregar diferentes tecnologias de armazenamento de dados dentro de uma mesma solução corporativa, selecionando o banco de dados cujo modelo conceitual, garantias de consistência e características de desempenho melhor resolvam o problema específico de cada microsserviço ou bounded context.

### 2. Motivações e Justificativa Arquitetural
Nenhuma tecnologia de banco de dados é excelente para todos os casos de uso simultâneos. Uma arquitetura monolítica centrada em um único SGBD relacional costuma forçar adaptações inadequadas. Em uma plataforma moderna, cada tecnologia atua onde é especialista:

1. **MongoDB (Orientado a Documentos):**
   - **Catálogo de Produtos / Extratos Dinâmicos:** Em um e-commerce ou plataforma bancária, produtos de categorias diferentes (eletrônicos, moda, seguros) têm especificações incompatíveis. O MongoDB permite armazenar esquemas heterogêneos sem tabelas de propriedades esparsas (`Entity-Attribute-Value`). Extratos com metadados ricos e mutáveis são lidos em milissegundos.
2. **Redis / Memcached (Chave-Valor em Memória):**
   - **Carrinho de Compras e Sessões de Usuário:** Operações ultra-rápidas com tempo de vida definido (*TTL - Time to Live*) e alto throughput de leitura/escrita em nanossegundos na RAM.
3. **PostgreSQL / Oracle (Relacional ACID Tradicional):**
   - **Contabilidade Geral e Fechamento Fiscal:** Livro razão (*general ledger*) corporativo, com integridade referencial estrita e regras normativas contábeis onde transações distribuídas e rigidez esquemática são pré-requisitos regulatórios.
4. **Elasticsearch (Indexação Textual / Busca Invertida):**
   - **Mecanismo de Pesquisa Textual e Auto-complete:** Busca fonética, tratamento de sinônimos e relevância ponderada em catálogos.

Ao segregar as responsabilidades, o sistema ganha elasticidade, escalabilidade horizontal seletiva (escalando apenas o microsserviço com maior carga) e desacoplamento operacional.

---

<div style="page-break-after: always;"></div>

# PARTE 2: Preparação do Ambiente e Operações CRUD

### Instruções Iniciais:
Base de dados utilizada: `ecommerce`  
Coleções criadas e manipuladas: `Clientes`, `Contas` e `Enderecos`.

---

### 2.1 Inserção de Dados (insertOne)
> Escreva o comando para inserir um novo cliente na coleção `Clientes` com os seguintes dados:
> - Nome: "Carlos Eduardo Silva"
> - CPF: "888.568.498-01"
> - Data de Nascimento: ISODate("1990-05-20T00:00:00Z")
> - Profissão: "Engenheiro de Software"
> - Status Civil: "Casado(a)"
> - Gênero: "Masculino"
> - Seguros: ["seguro de vida", "seguro para carro"]

```javascript
db.Clientes.insertOne({
  nome: "Carlos Eduardo Silva",
  cpf: "888.568.498-01",
  data_nascimento: ISODate("1990-05-20T00:00:00Z"),
  profissao: "Engenheiro de Software",
  status_civil: "Casado(a)",
  genero: "Masculino",
  seguros: ["seguro de vida", "seguro para carro"]
});
```

---

### 2.2 — Atualização com Incremental (updateOne, $set e $inc)
> Insira ou atualize o saldo da conta vinculada ao CPF "888.568.498-01" na coleção `Contas`, incrementando o campo valor em R$ 500,00.

```javascript
db.Contas.updateOne(
  { cpf: "888.568.498-01" },
  {
    $inc: { valor: 500.00 },
    $set: { data_ultima_atualizacao: new Date() }
  },
  { upsert: true }
);
```
*Justificativa Técnica:* O operador atômico `$inc` incrementa numericamente o valor do saldo sem risco de *race conditions* de leitura prévia. A flag `{ upsert: true }` garante a inserção automática da conta caso ela ainda não exista para o referido CPF.

---

### 2.3 — Manipulação de Arrays ($addToSet)
> Adicione o valor "seguro residencial" ao array de seguros do cliente com o CPF "888.568.498-01", garantindo que o valor não seja duplicado se já existir.

```javascript
db.Clientes.updateOne(
  { cpf: "888.568.498-01" },
  {
    $addToSet: { seguros: "seguro residencial" }
  }
);
```
*Justificativa Técnica:* Ao contrário do operador `$push` (que adicionaria elementos repetidos), o `$addToSet` trata o campo como um conjunto matemático, inserindo o item apenas se o valor ainda não constar no array.

---

### 2.4 — Remoção de Registros (deleteMany)
> Remova da coleção `Contas` todas as contas bancárias que possuem saldo (valor) menor ou igual a zero ($lte: 0).

```javascript
db.Contas.deleteMany({
  valor: { $lte: 0 }
});
```
*Justificativa Técnica:* O seletor `$lte: 0` (*less than or equal*) atinge todas as contas com saldo negativo ou zerado, excluindo-as em lote de forma eficiente.

---

<div style="page-break-after: always;"></div>

# PARTE 3: Consultas Simples e Avançadas (find)

---

### 3.1 — Projeção e Ordenação
> Consulte todos os clientes do gênero "Feminino". Retorne apenas os campos nome e profissao (ocultando o _id) e ordene o resultado em ordem alfabética crescente (1) pelo campo nome.

```javascript
db.Clientes.find(
  { genero: "Feminino" },
  { _id: 0, nome: 1, profissao: 1 }
).sort({ nome: 1 });
```

---

### 3.2 — Paginação (limit e skip)
> Realize uma busca na coleção `Contas` que pule os primeiros 20 documentos e retorne apenas os 5 documentos subsequentes.

```javascript
db.Contas.find({})
  .skip(20)
  .limit(5);
```

---

### 3.3 — Operadores de Comparação e Datas ($gt)
> Busque todos os clientes da coleção `Clientes` que nasceram após a data de 01/01/1992 (ISODate('1992-01-01')).

```javascript
db.Clientes.find({
  data_nascimento: { $gt: ISODate("1992-01-01T00:00:00Z") }
});
```

---

### 3.4 — Operadores Lógicos e de Conjunto ($or e $in)
> Busque todos os clientes cujo status_civil seja "Viúvo(a)" ou "Casado(a)" utilizando o operador $in.

```javascript
db.Clientes.find({
  status_civil: { $in: ["Viúvo(a)", "Casado(a)"] }
});
```

---

### 3.5 — Operadores de Elemento ($exists)
> Consulte todos os documentos da coleção `Clientes` que possuem o campo dependentes cadastrado ($exists: true).

```javascript
db.Clientes.find({
  dependentes: { $exists: true }
});
```

---

### 3.6 — Busca por Padrão de Texto ($regex)
> Consulte a coleção `Enderecos` e retorne todos os endereços cujo codigo_postal comece com a sequência de caracteres "16".

```javascript
db.Enderecos.find({
  codigo_postal: { $regex: /^16/ }
});
```
*Justificativa Técnica:* O caractere circunflexo `^` garante a correspondência a partir do início da string (âncora de início), permitindo ainda a utilização otimizada de índices B-tree sobre o campo `codigo_postal`.

---

<div style="page-break-after: always;"></div>

# PARTE 4: Processamento Avançado de Dados (aggregate)

---

### 4.1 — Agrupamento e Métricas Financeiras ($group)
> Agrupe os documentos da coleção `Contas` pelo campo tipo de conta. Para cada tipo, retorne:
> - O número total de contas por grupo ($sum ou $count).
> - A média do saldo ($avg no campo valor).
> - O maior saldo registrado no grupo ($max no campo valor).

```javascript
db.Contas.aggregate([
  {
    $group: {
      _id: "$tipo",
      total_contas: { $sum: 1 },
      media_saldo: { $avg: "$valor" },
      maior_saldo: { $max: "$valor" }
    }
  },
  {
    $sort: { total_contas: -1 }
  }
]);
```

---

### 4.2 — Desconstrução de Arrays e Contagem ($unwind e $sortByCount)
> 1. Aplique o estágio $unwind no campo seguros da coleção `Clientes` para desconstruir os elementos da matriz.
> 2. Em seguida, utilize o estágio $sortByCount no campo genero para contabilizar a quantidade de adesões aos seguros dividida por gênero.

```javascript
db.Clientes.aggregate([
  {
    $unwind: "$seguros"
  },
  {
    $sortByCount: "$genero"
  }
]);
```
*Justificativa Técnica:* O estágio `$unwind` desmembra cada elemento do array `seguros` gerando uma linha virtual por seguro contratado. Em seguida, o `$sortByCount: "$genero"` agrupa pelo campo gênero e ordena decrescentemente pelo total de ocorrências em uma única instrução otimizada.

---

### 4.3 — Filtragem e Agregação Combinada ($match e $group)
> Crie um pipeline de agregação que:
> 1. Filtre apenas as contas do tipo "Conta salário" com valor de saldo estritamente maior que 3500 ($match).
> 2. Agrupe o resultado obtido para contabilizar o total de contas que atendem a este critério.

```javascript
db.Contas.aggregate([
  {
    $match: {
      tipo: "Conta salário",
      valor: { $gt: 3500 }
    }
  },
  {
    $group: {
      _id: "$tipo",
      total_contas_elegiveis: { $sum: 1 },
      saldo_acumulado: { $sum: "$valor" }
    }
  }
]);
```

---

### 4.4 — Junção entre Coleções ($lookup e $project)
> Execute uma junção externa à esquerda entre as coleções `Clientes` e `Contas`:
> - Coleção de Origem: Clientes
> - Coleção Relacionada (from): "Contas"
> - Campo Local (localField): "cpf"
> - Campo Estrangeiro (foreignField): "cpf"
> - Apelido da Saída (as): "clientes_contas"
> - Projeção ($project): Oculte os campos _id, data_nascimento, genero e profissao, mantendo os demais.
> - Limite ($limit): Retorne apenas os 5 primeiros documentos do resultado.

```javascript
db.Clientes.aggregate([
  {
    $lookup: {
      from: "Contas",
      localField: "cpf",
      foreignField: "cpf",
      as: "clientes_contas"
    }
  },
  {
    $project: {
      _id: 0,
      data_nascimento: 0,
      genero: 0,
      profissao: 0
    }
  },
  {
    $limit: 5
  }
]);
```

---

<div style="page-break-after: always;"></div>

# DOCUMENTAÇÃO DA APLICAÇÃO BANCÁRIA

## 1. Tema Selecionado e Justificativa de Engenharia
- **Tema:** *Sistema de Gestão Bancária e Contas Financeiras* (Item 2 dos Temas do Professor).
- **Coleções Implementadas:**
  1. `Clientes`: Cadastro completo, renda, dependentes e matriz dinâmica de seguros contratados.
  2. `Contas`: Contas corrente, poupança e salário com agência, número único, limite de crédito e saldo.
  3. `Transacoes`: Extrato contábil dinâmico com entradas, saídas, PIX, transferências e saldo posterior.
  4. `Emprestimos`: Contratos de financiamento com taxas de juros, amortização e parcelas mensais.
- **Por que MongoDB?** No sistema bancário corporativo, extratos com estruturas variáveis de transações exigem alta velocidade de escrita e agregação analítica em tempo real (`$group`, `$sum`, `$avg`) para dashboards de liquidez e solvência.

## 2. Arquitetura da Solução Desenvolvida
- **Backend:** Node.js com Express e Driver Oficial MongoDB (`mongodb`).
- **Resiliência de Banco de Dados:** Suporte dinâmico a MongoDB local (porta 27017), MongoDB Atlas na nuvem e inicialização autônoma em memória para testes acadêmicos instantâneos.
- **Frontend:** Single-Page Application (SPA) responsiva com design moderno e elegante em CSS Vanilla, tipografia Inter e integração REST via `fetch` assíncrono.
- **Consistência Contábil:** Toda movimentação de saque ou transferência valida se o valor excede `saldo + limite_cheque_especial`. Ao aprovar um empréstimo, o valor é creditado na conta e uma transação de entrada é gerada automaticamente.

---

# GUIA DE CAPTURA DE TELAS (PRINTS PARA ENTREGA)

Para a composição final do PDF com as capturas de tela exigidas pelo professor, realize os prints nos seguintes momentos:

| # | Item a Capturar | Onde Capturar | O que deve aparecer em destaque |
|---|-----------------|---------------|----------------------------------|
| **Print 1** | Inserção 2.1 (`insertOne`) | MongoDB Compass / Mongosh | Execução do comando de inserção de Carlos Eduardo Silva com sucesso (`acknowledged: true`). |
| **Print 2** | Atualização 2.2 (`$inc`) | MongoDB Compass / Mongosh | Incremento de R$ 500,00 no saldo da conta vinculado ao CPF. |
| **Print 3** | Array 2.3 (`$addToSet`) | MongoDB Compass / Mongosh | Inclusão de "seguro residencial" no array `seguros` do cliente. |
| **Print 4** | Consulta 3.1 (Projeção/Sort)| MongoDB Compass / Mongosh | Retorno apenas de `nome` e `profissao` ordenados alfabeticamente. |
| **Print 5** | Consulta 3.6 (`$regex`) | MongoDB Compass / Mongosh | Retorno de endereços com CEP iniciando por "16". |
| **Print 6** | Pipeline 4.1 (`$group`) | Compass / Aplicação Web | Tabela com agrupamento por tipo de conta, média (`$avg`) e maior saldo (`$max`). |
| **Print 7** | Pipeline 4.2 (`$unwind`) | Compass / Aplicação Web | Contagem de seguros desconstruídos agrupados por gênero do cliente. |
| **Print 8** | Pipeline 4.4 (`$lookup`) | Compass / Aplicação Web | Junção de cliente trazendo o array aninhado de suas contas vinculadas. |
| **Print 9** | Dashboard da Aplicação | Navegador (`localhost:3000`) | Cards de indicadores financeiros em tempo real e gráficos calculados via MongoDB. |
| **Print 10**| Extrato e Movimentações | Navegador (`localhost:3000`) | Tela de transações com histórico de lançamentos e saldos atualizados. |

---
*Trabalho concluído com estrita observância a todas as especificações teóricas e práticas do edital.*
