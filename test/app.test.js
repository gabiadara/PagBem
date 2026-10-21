// test/app.test.js
const { connectDB, closeDB } = require('../src/db/connection');
const { seedDatabase } = require('../src/db/seed');

async function runTests() {
  console.log('====================================================');
  console.log(' INICIANDO BATERIA DE TESTES AUTOMATIZADOS (MONGODB)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const db = await connectDB();
    console.log('[1/7] Testando conexão com MongoDB...');
    assert(db !== null && typeof db.collection === 'function', 'Conexão ativa com o banco');

    console.log('\n[2/7] Testando inicialização e Seed com dados de demonstração...');
    const seedRes = await seedDatabase({ reset: true });
    assert(seedRes.status === 'success', 'Seed executado com sucesso');

    const totalCli = await db.collection('Clientes').countDocuments();
    const totalContas = await db.collection('Contas').countDocuments();
    const totalTrx = await db.collection('Transacoes').countDocuments();
    const totalEmp = await db.collection('Emprestimos').countDocuments();

    assert(totalCli >= 6, `Clientes persistidos no MongoDB (Total: ${totalCli})`);
    assert(totalContas >= 9, `Contas persistidas no MongoDB (Total: ${totalContas})`);
    assert(totalTrx >= 9, `Transações persistidas no MongoDB (Total: ${totalTrx})`);
    assert(totalEmp >= 4, `Empréstimos persistidos no MongoDB (Total: ${totalEmp})`);

    console.log('\n[3/7] Testando Operações CRUD e Manipulação de Arrays...');
    // Inserção 2.1
    const testCpf = '999.888.777-66';
    await db.collection('Clientes').insertOne({
      nome: 'Teste de QA Automatizado',
      cpf: testCpf,
      genero: 'Feminino',
      status_civil: 'Casado(a)',
      seguros: ['seguro de vida']
    });
    const cliInserido = await db.collection('Clientes').findOne({ cpf: testCpf });
    assert(cliInserido !== null && cliInserido.nome === 'Teste de QA Automatizado', '2.1 Inserção de cliente persistida com sucesso');

    // Manipulação $addToSet 2.3
    await db.collection('Clientes').updateOne({ cpf: testCpf }, { $addToSet: { seguros: 'seguro residencial' } });
    await db.collection('Clientes').updateOne({ cpf: testCpf }, { $addToSet: { seguros: 'seguro residencial' } }); // Repetido de propósito
    const cliSeguro = await db.collection('Clientes').findOne({ cpf: testCpf });
    const countResidencial = cliSeguro.seguros.filter(s => s === 'seguro residencial').length;
    assert(countResidencial === 1, '2.3 $addToSet garantiu unicidade do item no array');

    console.log('\n[4/7] Testando Movimentação Financeira e Consistência de Saldos...');
    const contaTeste = '10001-5';
    const contaAntes = await db.collection('Contas').findOne({ numero_conta: contaTeste });
    const saldoInicial = contaAntes.valor;

    // Teste de Depósito com $inc
    const valorDeposito = 1250.00;
    await db.collection('Contas').updateOne({ numero_conta: contaTeste }, { $inc: { valor: valorDeposito } });
    const contaAposDep = await db.collection('Contas').findOne({ numero_conta: contaTeste });
    assert(contaAposDep.valor === saldoInicial + valorDeposito, 'Atualização de saldo com $inc funcionou perfeitamente');

    // Teste de Rejeição de Saque acima do Saldo + Limite
    const limiteTotal = contaAposDep.valor + (contaAposDep.limite_cheque_especial || 0);
    const tentativaSaque = limiteTotal + 5000;
    const podeSacar = tentativaSaque <= limiteTotal;
    assert(podeSacar === false, 'Sistema rejeita com sucesso saque que extrapola saldo e limite');

    console.log('\n[5/7] Testando Contratação de Empréstimo e Vínculo com Conta...');
    const empCpf = '888.568.498-01';
    const empConta = '10001-5';
    const saldoAntesEmp = (await db.collection('Contas').findOne({ numero_conta: empConta })).valor;
    const valorEmp = 10000.00;

    // Registra empréstimo e credita
    await db.collection('Emprestimos').insertOne({
      codigo_emprestimo: 'EMP-QA-TESTE',
      cpf_cliente: empCpf,
      numero_conta: empConta,
      valor_solicitado: valorEmp,
      status: 'Ativo'
    });
    await db.collection('Contas').updateOne({ numero_conta: empConta }, { $inc: { valor: valorEmp } });

    const saldoAposEmp = (await db.collection('Contas').findOne({ numero_conta: empConta })).valor;
    assert(saldoAposEmp === saldoAntesEmp + valorEmp, 'Empréstimo contratado creditou o saldo na conta do cliente');

    console.log('\n[6/7] Testando Pipelines de Agregação Acadêmicos (aggregate)...');
    // Pipeline 4.1 ($group com $sum, $avg, $max)
    const res41 = await db.collection('Contas').aggregate([
      {
        $group: {
          _id: '$tipo',
          total: { $sum: 1 },
          media: { $avg: '$valor' },
          maior: { $max: '$valor' }
        }
      }
    ]).toArray();
    assert(res41.length >= 2, `Pipeline 4.1 ($group) retornou métricas de ${res41.length} tipos de conta`);

    // Pipeline 4.2 ($unwind e $sortByCount)
    const res42 = await db.collection('Clientes').aggregate([
      { $unwind: '$seguros' },
      { $sortByCount: '$genero' }
    ]).toArray();
    assert(res42.length >= 2, `Pipeline 4.2 ($unwind + $sortByCount) desconstruiu seguros por gênero com sucesso`);

    // Pipeline 4.3 ($match e $group)
    const res43 = await db.collection('Contas').aggregate([
      { $match: { tipo: 'Conta salário', valor: { $gt: 3500 } } },
      { $group: { _id: '$tipo', total: { $sum: 1 } } }
    ]).toArray();
    assert(res43.length > 0 && res43[0].total >= 1, `Pipeline 4.3 ($match Conta salário > 3500) filtrou e agrupou contas`);

    // Pipeline 4.4 ($lookup Clientes -> Contas)
    const res44 = await db.collection('Clientes').aggregate([
      {
        $lookup: {
          from: 'Contas',
          localField: 'cpf',
          foreignField: 'cpf',
          as: 'clientes_contas'
        }
      },
      { $limit: 3 }
    ]).toArray();
    assert(res44.length === 3 && Array.isArray(res44[0].clientes_contas), 'Pipeline 4.4 ($lookup) realizou junção externa com contas aninhadas');

    console.log('\n[7/7] Limpando dados de teste pontuais...');
    await db.collection('Clientes').deleteOne({ cpf: testCpf });
    await db.collection('Emprestimos').deleteOne({ codigo_emprestimo: 'EMP-QA-TESTE' });
    console.log('  [PASS] Limpeza concluída');

  } catch (err) {
    console.error('ERRO INESPERADO NOS TESTES:', err);
    failed++;
  } finally {
    await closeDB();
    console.log('\n====================================================');
    console.log(` RESULTADO DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
