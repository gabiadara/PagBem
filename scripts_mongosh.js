/**
 * SCRIPTS MONGOSH OFICIAIS - TRABALHO PRÁTICO DE BANCO DE DADOS / NOSQL
 * Professor: Marcos Rodrigo Momo
 * Aluna: Gabriela Adara Amarante
 * Disciplina: Banco de Dados / NoSQL - IFSC Câmpus Gaspar
 *
 * Instruções: Execute estes comandos no MongoDB Compass (Mongosh) ou no NoSQLBooster.
 */

// Seleciona a base de dados
use("ecommerce");

// ============================================================================
// PARTE 2: Preparação do Ambiente e Operações CRUD
// ============================================================================

// ----------------------------------------------------------------------------
// 2.1 Inserção de Dados (insertOne)
// Escreva o comando para inserir um novo cliente na coleção Clientes com os dados:
// ----------------------------------------------------------------------------
db.Clientes.insertOne({
  nome: "Carlos Eduardo Silva",
  cpf: "888.568.498-01",
  data_nascimento: ISODate("1990-05-20T00:00:00Z"),
  profissao: "Engenheiro de Software",
  status_civil: "Casado(a)",
  genero: "Masculino",
  seguros: ["seguro de vida", "seguro para carro"]
});

// ----------------------------------------------------------------------------
// 2.2 — Atualização com Incremental (updateOne, $set e $inc)
// Insira ou atualize o saldo da conta vinculada ao CPF "888.568.498-01" na coleção 
// Contas, incrementando o campo valor em R$ 500,00.
// ----------------------------------------------------------------------------
db.Contas.updateOne(
  { cpf: "888.568.498-01" },
  {
    $inc: { valor: 500.00 },
    $set: { data_ultima_atualizacao: new Date() }
  },
  { upsert: true }
);

// ----------------------------------------------------------------------------
// 2.3 — Manipulação de Arrays ($addToSet)
// Adicione o valor "seguro residencial" ao array de seguros do cliente com o CPF 
// "888.568.498-01", garantindo que o valor não seja duplicado se já existir.
// ----------------------------------------------------------------------------
db.Clientes.updateOne(
  { cpf: "888.568.498-01" },
  {
    $addToSet: { seguros: "seguro residencial" }
  }
);

// ----------------------------------------------------------------------------
// 2.4 — Remoção de Registros (deleteMany)
// Remova da coleção Contas todas as contas bancárias que possuem saldo (valor) 
// menor ou igual a zero ($lte: 0).
// ----------------------------------------------------------------------------
db.Contas.deleteMany({
  valor: { $lte: 0 }
});


// ============================================================================
// PARTE 3: Consultas Simples e Avançadas (find)
// ============================================================================

// ----------------------------------------------------------------------------
// 3.1 — Projeção e Ordenação
// Consulte todos os clientes do gênero "Feminino". Retorne apenas os campos nome e 
// profissao (ocultando o _id) e ordene o resultado em ordem alfabética crescente (1) 
// pelo campo nome.
// ----------------------------------------------------------------------------
db.Clientes.find(
  { genero: "Feminino" },
  { _id: 0, nome: 1, profissao: 1 }
).sort({ nome: 1 });

// ----------------------------------------------------------------------------
// 3.2 — Paginação (limit e skip)
// Realize uma busca na coleção Contas que pule os primeiros 20 documentos e 
// retorne apenas os 5 documentos subsequentes.
// ----------------------------------------------------------------------------
db.Contas.find({})
  .skip(20)
  .limit(5);

// ----------------------------------------------------------------------------
// 3.3 — Operadores de Comparação e Datas ($gt)
// Busque todos os clientes da coleção Clientes que nasceram após a data de 01/01/1992
// (ISODate('1992-01-01')).
// ----------------------------------------------------------------------------
db.Clientes.find({
  data_nascimento: { $gt: ISODate("1992-01-01T00:00:00Z") }
});

// ----------------------------------------------------------------------------
// 3.4 — Operadores Lógicos e de Conjunto ($or e $in)
// Busque todos os clientes cujo status_civil seja "Viúvo(a)" ou "Casado(a)" 
// utilizando o operador $in.
// ----------------------------------------------------------------------------
db.Clientes.find({
  status_civil: { $in: ["Viúvo(a)", "Casado(a)"] }
});

// ----------------------------------------------------------------------------
// 3.5 — Operadores de Elemento ($exists)
// Consulte todos os documentos da coleção Clientes que possuem o campo dependentes 
// cadastrado ($exists: true).
// ----------------------------------------------------------------------------
db.Clientes.find({
  dependentes: { $exists: true }
});

// ----------------------------------------------------------------------------
// 3.6 — Busca por Padrão de Texto ($regex)
// Consulte a coleção Enderecos e retorne todos os endereços cujo codigo_postal 
// comece com a sequência de caracteres "16".
// ----------------------------------------------------------------------------
db.Enderecos.find({
  codigo_postal: { $regex: /^16/ }
});


// ============================================================================
// PARTE 4: Processamento Avançado de Dados (aggregate)
// ============================================================================

// ----------------------------------------------------------------------------
// 4.1 — Agrupamento e Métricas Financeiras ($group)
// Agrupe os documentos da coleção Contas pelo campo tipo de conta. Para cada tipo, retorne:
// - O número total de contas por grupo ($sum ou $count)
// - A média do saldo ($avg no campo valor)
// - O maior saldo registrado no grupo ($max no campo valor)
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// 4.2 — Desconstrução de Arrays e Contagem ($unwind e $sortByCount)
// 1. Aplique o estágio $unwind no campo seguros da coleção Clientes para desconstruir os elementos da matriz.
// 2. Em seguida, utilize o estágio $sortByCount no campo genero para contabilizar a quantidade de adesões aos seguros dividida por gênero.
// ----------------------------------------------------------------------------
db.Clientes.aggregate([
  {
    $unwind: "$seguros"
  },
  {
    $sortByCount: "$genero"
  }
]);

// ----------------------------------------------------------------------------
// 4.3 — Filtragem e Agregação Combinada ($match e $group)
// Crie um pipeline de agregação que:
// 1. Filtre apenas as contas do tipo "Conta salário" com valor de saldo estritamente maior que 3500 ($match).
// 2. Agrupe o resultado obtido para contabilizar o total de contas que atendem a este critério.
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// 4.4 — Junção entre Coleções ($lookup e $project)
// Execute uma junção externa à esquerda entre as coleções Clientes e Contas:
// - Coleção de Origem: Clientes
// - Coleção Relacionada (from): "Contas"
// - Campo Local (localField): "cpf"
// - Campo Estrangeiro (foreignField): "cpf"
// - Apelido da Saída (as): "clientes_contas"
// - Projeção ($project): Oculte os campos _id, data_nascimento, genero e profissao, mantendo os demais.
// - Limite ($limit): Retorne apenas os 5 primeiros documentos do resultado.
// ----------------------------------------------------------------------------
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
