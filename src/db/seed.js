// src/db/seed.js
const { connectDB, closeDB } = require('./connection');

async function seedDatabase(options = { reset: false }) {
  const db = await connectDB();
  console.log('[Seed] Verificando coleções no MongoDB...');

  const clientesCol = db.collection('Clientes');
  const contasCol = db.collection('Contas');
  const transacoesCol = db.collection('Transacoes');
  const emprestimosCol = db.collection('Emprestimos');

  const countClientes = await clientesCol.countDocuments();

  if (countClientes > 0 && !options.reset) {
    console.log(`[Seed] O banco já possui ${countClientes} clientes cadastrados. Pulando seed.`);
    return { status: 'already_seeded', count: countClientes };
  }

  if (options.reset) {
    console.log('[Seed] Reset ativado: limpando coleções...');
    await clientesCol.deleteMany({});
    await contasCol.deleteMany({});
    await transacoesCol.deleteMany({});
    await emprestimosCol.deleteMany({});
  }

  console.log('[Seed] Criando índices essenciais...');
  await clientesCol.createIndex({ cpf: 1 }, { unique: true });
  await clientesCol.createIndex({ email: 1 });
  await contasCol.createIndex({ numero_conta: 1 }, { unique: true });
  await contasCol.createIndex({ cpf: 1 });
  await transacoesCol.createIndex({ conta_origem: 1, data: -1 });
  await transacoesCol.createIndex({ data: -1 });
  await emprestimosCol.createIndex({ cpf_cliente: 1 });
  await emprestimosCol.createIndex({ status: 1 });

  console.log('[Seed] Inserindo dados de demonstração...');

  // 1. Clientes
  const clientesData = [
    {
      nome: 'Carlos Eduardo Silva',
      cpf: '888.568.498-01',
      email: 'carlos.silva@exemplo.com.br',
      telefone: '(11) 98765-4321',
      data_nascimento: new Date('1990-05-20T00:00:00Z'),
      profissao: 'Engenheiro de Software',
      status_civil: 'Casado(a)',
      genero: 'Masculino',
      renda_mensal: 14500.00,
      dependentes: [
        { nome: 'Beatriz Silva', parentesco: 'Filha', idade: 5 }
      ],
      seguros: ['seguro de vida', 'seguro para carro'],
      endereco: {
        logradouro: 'Rua das Flores, 120',
        bairro: 'Jardins',
        cidade: 'São Paulo',
        estado: 'SP',
        codigo_postal: '01415-000'
      },
      data_criacao: new Date('2024-01-15T10:00:00Z')
    },
    {
      nome: 'Mariana Cristina Santos',
      cpf: '456.789.123-02',
      email: 'mariana.santos@exemplo.com.br',
      telefone: '(47) 99123-4567',
      data_nascimento: new Date('1994-08-14T00:00:00Z'),
      profissao: 'Arquiteta de Soluções',
      status_civil: 'Solteiro(a)',
      genero: 'Feminino',
      renda_mensal: 16800.00,
      dependentes: [],
      seguros: ['seguro de vida', 'seguro residencial'],
      endereco: {
        logradouro: 'Av. Brasil, 450',
        bairro: 'Centro',
        cidade: 'Blumenau',
        estado: 'SC',
        codigo_postal: '89010-000'
      },
      data_criacao: new Date('2024-02-10T11:30:00Z')
    },
    {
      nome: 'Fernanda Oliveira Rocha',
      cpf: '321.654.987-03',
      email: 'fernanda.rocha@exemplo.com.br',
      telefone: '(48) 98877-6655',
      data_nascimento: new Date('1988-12-05T00:00:00Z'),
      profissao: 'Médica Cardiologista',
      status_civil: 'Casado(a)',
      genero: 'Feminino',
      renda_mensal: 24000.00,
      dependentes: [
        { nome: 'Lucas Rocha', parentesco: 'Filho', idade: 8 },
        { nome: 'Ana Rocha', parentesco: 'Filha', idade: 3 }
      ],
      seguros: ['seguro de vida', 'seguro para carro', 'seguro residencial'],
      endereco: {
        logradouro: 'Rua Bocaiúva, 800',
        bairro: 'Centro',
        cidade: 'Florianópolis',
        estado: 'SC',
        codigo_postal: '88015-530'
      },
      data_criacao: new Date('2024-02-20T14:15:00Z')
    },
    {
      nome: 'Juliana Mendes Moreira',
      cpf: '654.321.789-04',
      email: 'juliana.moreira@exemplo.com.br',
      telefone: '(19) 97766-5544',
      data_nascimento: new Date('1995-03-25T00:00:00Z'),
      profissao: 'Analista de Dados',
      status_civil: 'Solteiro(a)',
      genero: 'Feminino',
      renda_mensal: 9200.00,
      dependentes: [],
      seguros: ['seguro para carro'],
      endereco: {
        logradouro: 'Rua Barão de Jaguara, 1020',
        bairro: 'Cambuí',
        cidade: 'Campinas',
        estado: 'SP',
        codigo_postal: '13015-002'
      },
      data_criacao: new Date('2024-03-01T09:00:00Z')
    },
    {
      nome: 'Roberto Alves de Almeida',
      cpf: '789.123.456-05',
      email: 'roberto.almeida@exemplo.com.br',
      telefone: '(16) 99234-5678',
      data_nascimento: new Date('1975-11-19T00:00:00Z'),
      profissao: 'Diretor Financeiro',
      status_civil: 'Viúvo(a)',
      genero: 'Masculino',
      renda_mensal: 29500.00,
      dependentes: [
        { nome: 'Gabriel Almeida', parentesco: 'Filho', idade: 17 }
      ],
      seguros: ['seguro de vida', 'seguro residencial', 'seguro para carro'],
      endereco: {
        logradouro: 'Av. Nove de Julho, 1500',
        bairro: 'Higienópolis',
        cidade: 'Ribeirão Preto',
        estado: 'SP',
        codigo_postal: '16020-110' // Código postal começando com 16 para demonstrar regex acadêmico
      },
      data_criacao: new Date('2024-03-12T16:45:00Z')
    },
    {
      nome: 'Patricia Helena Duarte',
      cpf: '951.357.246-06',
      email: 'patricia.duarte@exemplo.com.br',
      telefone: '(16) 98112-3344',
      data_nascimento: new Date('1993-07-08T00:00:00Z'),
      profissao: 'Professora Universitária',
      status_civil: 'Casado(a)',
      genero: 'Feminino',
      renda_mensal: 8700.00,
      dependentes: [
        { nome: 'Theo Duarte', parentesco: 'Filho', idade: 2 }
      ],
      seguros: ['seguro de vida'],
      endereco: {
        logradouro: 'Rua São Sebastião, 600',
        bairro: 'Centro',
        cidade: 'São Carlos',
        estado: 'SP',
        codigo_postal: '16500-200' // Código postal começando com 16
      },
      data_criacao: new Date('2024-03-25T13:20:00Z')
    }
  ];

  await clientesCol.insertMany(clientesData);

  // 2. Contas Bancárias
  const contasData = [
    {
      numero_conta: '10001-5',
      agencia: '0001',
      tipo: 'Conta corrente',
      cpf: '888.568.498-01',
      titular: 'Carlos Eduardo Silva',
      valor: 8250.00,
      limite_cheque_especial: 3000.00,
      status: 'Ativa',
      data_abertura: new Date('2024-01-16T10:00:00Z')
    },
    {
      numero_conta: '10002-3',
      agencia: '0001',
      tipo: 'Conta poupança',
      cpf: '888.568.498-01',
      titular: 'Carlos Eduardo Silva',
      valor: 15400.00,
      limite_cheque_especial: 0.00,
      status: 'Ativa',
      data_abertura: new Date('2024-01-18T14:00:00Z')
    },
    {
      numero_conta: '20001-8',
      agencia: '0001',
      tipo: 'Conta corrente',
      cpf: '456.789.123-02',
      titular: 'Mariana Cristina Santos',
      valor: 12850.50,
      limite_cheque_especial: 5000.00,
      status: 'Ativa',
      data_abertura: new Date('2024-02-11T12:00:00Z')
    },
    {
      numero_conta: '20002-6',
      agencia: '0001',
      tipo: 'Conta salário',
      cpf: '456.789.123-02',
      titular: 'Mariana Cristina Santos',
      valor: 4600.00, // Salário > 3500 para consulta acadêmica
      limite_cheque_especial: 0.00,
      status: 'Ativa',
      data_abertura: new Date('2024-02-12T09:30:00Z')
    },
    {
      numero_conta: '30001-0',
      agencia: '0002',
      tipo: 'Conta corrente',
      cpf: '321.654.987-03',
      titular: 'Fernanda Oliveira Rocha',
      valor: 34200.00,
      limite_cheque_especial: 10000.00,
      status: 'Ativa',
      data_abertura: new Date('2024-02-21T15:00:00Z')
    },
    {
      numero_conta: '30002-9',
      agencia: '0002',
      tipo: 'Conta salário',
      cpf: '321.654.987-03',
      titular: 'Fernanda Oliveira Rocha',
      valor: 6800.00, // Salário > 3500 para agregação acadêmica
      limite_cheque_especial: 0.00,
      status: 'Ativa',
      data_abertura: new Date('2024-02-22T10:15:00Z')
    },
    {
      numero_conta: '40001-2',
      agencia: '0002',
      tipo: 'Conta corrente',
      cpf: '654.321.789-04',
      titular: 'Juliana Mendes Moreira',
      valor: 5120.00,
      limite_cheque_especial: 2500.00,
      status: 'Ativa',
      data_abertura: new Date('2024-03-02T11:00:00Z')
    },
    {
      numero_conta: '50001-7',
      agencia: '0001',
      tipo: 'Conta corrente',
      cpf: '789.123.456-05',
      titular: 'Roberto Alves de Almeida',
      valor: 48900.00,
      limite_cheque_especial: 15000.00,
      status: 'Ativa',
      data_abertura: new Date('2024-03-13T10:30:00Z')
    },
    {
      numero_conta: '60001-4',
      agencia: '0002',
      tipo: 'Conta salário',
      cpf: '951.357.246-06',
      titular: 'Patricia Helena Duarte',
      valor: 3950.00, // Salário > 3500
      limite_cheque_especial: 0.00,
      status: 'Ativa',
      data_abertura: new Date('2024-03-26T14:40:00Z')
    }
  ];

  await contasCol.insertMany(contasData);

  // 3. Transações Financeiras (com entradas, saídas e transferências)
  const transacoesData = [
    {
      id_transacao: 'TRX-1001',
      tipo: 'Depósito',
      natureza: 'Entrada',
      valor: 5000.00,
      conta_origem: '10001-5',
      conta_destino: null,
      descricao: 'Depósito em dinheiro via terminal eletrônico',
      data: new Date('2024-01-20T11:15:00Z'),
      saldo_posterior: 5000.00,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-1002',
      tipo: 'PIX Recebido',
      natureza: 'Entrada',
      valor: 4000.00,
      conta_origem: '10001-5',
      conta_destino: null,
      descricao: 'Pagamento de consultoria de software',
      data: new Date('2024-02-05T14:20:00Z'),
      saldo_posterior: 9000.00,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-1003',
      tipo: 'Saque',
      natureza: 'Saída',
      valor: 750.00,
      conta_origem: '10001-5',
      conta_destino: null,
      descricao: 'Saque no caixa 24 horas',
      data: new Date('2024-02-15T16:45:00Z'),
      saldo_posterior: 8250.00,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-2001',
      tipo: 'Depósito',
      natureza: 'Entrada',
      valor: 15000.00,
      conta_origem: '20001-8',
      conta_destino: null,
      descricao: 'Aporte de capital inicial',
      data: new Date('2024-02-12T10:00:00Z'),
      saldo_posterior: 15000.00,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-2002',
      tipo: 'Transferência TED',
      natureza: 'Saída',
      valor: 2149.50,
      conta_origem: '20001-8',
      conta_destino: '10001-5',
      descricao: 'Transferência de serviços',
      data: new Date('2024-03-01T15:30:00Z'),
      saldo_posterior: 12850.50,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-3001',
      tipo: 'Depósito',
      natureza: 'Entrada',
      valor: 35000.00,
      conta_origem: '30001-0',
      conta_destino: null,
      descricao: 'Depósito de proventos médicos',
      data: new Date('2024-02-25T11:00:00Z'),
      saldo_posterior: 35000.00,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-3002',
      tipo: 'Pagamento de Boleto',
      natureza: 'Saída',
      valor: 800.00,
      conta_origem: '30001-0',
      conta_destino: null,
      descricao: 'Pagamento de condomínio residencial',
      data: new Date('2024-03-05T09:10:00Z'),
      saldo_posterior: 34200.00,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-5001',
      tipo: 'Depósito',
      natureza: 'Entrada',
      valor: 50000.00,
      conta_origem: '50001-7',
      conta_destino: null,
      descricao: 'Distribuição de lucros semestrais',
      data: new Date('2024-03-14T08:30:00Z'),
      saldo_posterior: 50000.00,
      status: 'Concluída'
    },
    {
      id_transacao: 'TRX-5002',
      tipo: 'PIX Enviado',
      natureza: 'Saída',
      valor: 1100.00,
      conta_origem: '50001-7',
      conta_destino: '40001-2',
      descricao: 'Transferência pessoal',
      data: new Date('2024-03-20T17:00:00Z'),
      saldo_posterior: 48900.00,
      status: 'Concluída'
    }
  ];

  await transacoesCol.insertMany(transacoesData);

  // 4. Empréstimos Bancários
  const emprestimosData = [
    {
      codigo_emprestimo: 'EMP-2024-001',
      cpf_cliente: '888.568.498-01',
      nome_cliente: 'Carlos Eduardo Silva',
      numero_conta: '10001-5',
      valor_solicitado: 25000.00,
      taxa_juros_mensal: 1.85,
      prazo_meses: 24,
      valor_parcela: 1297.80,
      total_a_pagar: 31147.20,
      status: 'Ativo',
      finalidade: 'Reforma Residencial',
      parcelas_pagas: 6,
      data_contratacao: new Date('2024-01-25T14:00:00Z'),
      proximo_vencimento: new Date('2024-08-25T00:00:00Z')
    },
    {
      codigo_emprestimo: 'EMP-2024-002',
      cpf_cliente: '456.789.123-02',
      nome_cliente: 'Mariana Cristina Santos',
      numero_conta: '20001-8',
      valor_solicitado: 45000.00,
      taxa_juros_mensal: 1.60,
      prazo_meses: 36,
      valor_parcela: 1656.40,
      total_a_pagar: 59630.40,
      status: 'Ativo',
      finalidade: 'Aquisição de Equipamentos de TI',
      parcelas_pagas: 3,
      data_contratacao: new Date('2024-02-18T16:30:00Z'),
      proximo_vencimento: new Date('2024-08-18T00:00:00Z')
    },
    {
      codigo_emprestimo: 'EMP-2024-003',
      cpf_cliente: '321.654.987-03',
      nome_cliente: 'Fernanda Oliveira Rocha',
      numero_conta: '30001-0',
      valor_solicitado: 80000.00,
      taxa_juros_mensal: 1.45,
      prazo_meses: 48,
      valor_parcela: 2329.10,
      total_a_pagar: 111796.80,
      status: 'Em Análise',
      finalidade: 'Abertura de Consultório Médico',
      parcelas_pagas: 0,
      data_contratacao: new Date('2024-03-10T11:20:00Z'),
      proximo_vencimento: null
    },
    {
      codigo_emprestimo: 'EMP-2024-004',
      cpf_cliente: '789.123.456-05',
      nome_cliente: 'Roberto Alves de Almeida',
      numero_conta: '50001-7',
      valor_solicitado: 15000.00,
      taxa_juros_mensal: 2.10,
      prazo_meses: 12,
      valor_parcela: 1426.30,
      total_a_pagar: 17115.60,
      status: 'Liquidado',
      finalidade: 'Viagem Internacional',
      parcelas_pagas: 12,
      data_contratacao: new Date('2023-03-01T09:00:00Z'),
      proximo_vencimento: null
    }
  ];

  await emprestimosCol.insertMany(emprestimosData);

  console.log('[Seed] Sucesso: Banco inicializado com clientes, contas, transações e empréstimos!');
  return {
    status: 'success',
    inserted: {
      clientes: clientesData.length,
      contas: contasData.length,
      transacoes: transacoesData.length,
      emprestimos: emprestimosData.length
    }
  };
}

// Execução direta via CLI se chamado diretamente
if (require.main === module) {
  const isReset = process.argv.includes('--reset');
  seedDatabase({ reset: isReset })
    .then((res) => {
      console.log('[Seed CLI] Concluído:', res);
      return closeDB();
    })
    .catch((err) => {
      console.error('[Seed CLI] Erro fatal:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
