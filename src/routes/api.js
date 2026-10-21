// src/routes/api.js
const express = require('express');
const { getDB } = require('../db/connection');
const { seedDatabase } = require('../db/seed');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Helper para converter string ObjectId com segurança
function safeObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (e) {
    return null;
  }
}

// -------------------------------------------------------------
// SEED & MANUTENÇÃO DO BANCO
// -------------------------------------------------------------
router.post('/seed', async (req, res) => {
  try {
    const reset = req.body && req.body.reset === true;
    const result = await seedDatabase({ reset });
    return res.json({ success: true, message: 'Dados de demonstração processados!', data: result });
  } catch (err) {
    console.error('[API /seed]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 1. DASHBOARD & INDICADORES GERAIS (Agregações)
// -------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
  try {
    const db = await getDB();
    const clientesCol = db.collection('Clientes');
    const contasCol = db.collection('Contas');
    const transacoesCol = db.collection('Transacoes');
    const emprestimosCol = db.collection('Emprestimos');

    const totalClientes = await clientesCol.countDocuments();
    const totalContas = await contasCol.countDocuments();
    const totalTransacoes = await transacoesCol.countDocuments();
    const totalEmprestimos = await emprestimosCol.countDocuments();

    // Pipeline Agregação 1: Saldo total e saldo médio global
    const saldoRes = await contasCol.aggregate([
      {
        $group: {
          _id: null,
          saldoTotal: { $sum: '$valor' },
          saldoMedio: { $avg: '$valor' },
          maiorSaldo: { $max: '$valor' }
        }
      }
    ]).toArray();

    const metricasContas = saldoRes[0] || { saldoTotal: 0, saldoMedio: 0, maiorSaldo: 0 };

    // Pipeline Agregação 2: Totais e médias de Empréstimos
    const empRes = await emprestimosCol.aggregate([
      {
        $group: {
          _id: null,
          totalEmprestado: { $sum: '$valor_solicitado' },
          totalReceber: { $sum: '$total_a_pagar' },
          mediaTaxa: { $avg: '$taxa_juros_mensal' }
        }
      }
    ]).toArray();

    const metricasEmprestimos = empRes[0] || { totalEmprestado: 0, totalReceber: 0, mediaTaxa: 0 };

    // Pipeline Agregação 3: Distribuição por Tipo de Conta ($group, $sum, $avg, $max)
    const contasPorTipo = await contasCol.aggregate([
      {
        $group: {
          _id: '$tipo',
          totalContas: { $sum: 1 },
          saldoAcumulado: { $sum: '$valor' },
          saldoMedio: { $avg: '$valor' },
          maiorSaldo: { $max: '$valor' }
        }
      },
      { $sort: { saldoAcumulado: -1 } }
    ]).toArray();

    // Últimas 5 transações registradas
    const ultimasTransacoes = await transacoesCol.find({})
      .sort({ data: -1 })
      .limit(5)
      .toArray();

    return res.json({
      success: true,
      data: {
        totalClientes,
        totalContas,
        totalTransacoes,
        totalEmprestimos,
        saldoTotal: metricasContas.saldoTotal,
        saldoMedio: metricasContas.saldoMedio,
        maiorSaldo: metricasContas.maiorSaldo,
        totalEmprestado: metricasEmprestimos.totalEmprestado,
        totalReceber: metricasEmprestimos.totalReceber,
        contasPorTipo,
        ultimasTransacoes
      }
    });
  } catch (err) {
    console.error('[API /dashboard]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. CLIENTES (CRUD Completo)
// -------------------------------------------------------------
router.get('/clientes', async (req, res) => {
  try {
    const db = await getDB();
    const { genero, busca } = req.query;
    const filter = {};

    if (genero) filter.genero = genero;
    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { cpf: { $regex: busca, $options: 'i' } },
        { profissao: { $regex: busca, $options: 'i' } }
      ];
    }

    const clientes = await db.collection('Clientes').find(filter).sort({ nome: 1 }).toArray();
    return res.json({ success: true, data: clientes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/clientes/:id', async (req, res) => {
  try {
    const db = await getDB();
    const objId = safeObjectId(req.params.id);
    const query = objId ? { _id: objId } : { cpf: req.params.id };

    const cliente = await db.collection('Clientes').findOne(query);
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });

    // Busca contas e empréstimos vinculados
    const contas = await db.collection('Contas').find({ cpf: cliente.cpf }).toArray();
    const emprestimos = await db.collection('Emprestimos').find({ cpf_cliente: cliente.cpf }).toArray();

    return res.json({ success: true, data: { ...cliente, contas, emprestimos } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/clientes', async (req, res) => {
  try {
    const db = await getDB();
    const {
      nome,
      cpf,
      email,
      telefone,
      data_nascimento,
      profissao,
      status_civil,
      genero,
      renda_mensal,
      dependentes,
      seguros,
      endereco
    } = req.body;

    if (!nome || !cpf) {
      return res.status(400).json({ success: false, error: 'Nome e CPF são obrigatórios.' });
    }

    const existe = await db.collection('Clientes').findOne({ cpf });
    if (existe) {
      return res.status(400).json({ success: false, error: 'Já existe um cliente cadastrado com este CPF.' });
    }

    const novoCliente = {
      nome,
      cpf,
      email: email || '',
      telefone: telefone || '',
      data_nascimento: data_nascimento ? new Date(data_nascimento) : null,
      profissao: profissao || 'Não informada',
      status_civil: status_civil || 'Solteiro(a)',
      genero: genero || 'Outro',
      renda_mensal: parseFloat(renda_mensal) || 0,
      dependentes: Array.isArray(dependentes) ? dependentes : [],
      seguros: Array.isArray(seguros) ? seguros : [],
      endereco: endereco || {},
      data_criacao: new Date()
    };

    const result = await db.collection('Clientes').insertOne(novoCliente);
    return res.status(201).json({ success: true, data: { _id: result.insertedId, ...novoCliente } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/clientes/:id', async (req, res) => {
  try {
    const db = await getDB();
    const objId = safeObjectId(req.params.id);
    const query = objId ? { _id: objId } : { cpf: req.params.id };

    const updateFields = { ...req.body };
    delete updateFields._id;
    if (updateFields.data_nascimento) {
      updateFields.data_nascimento = new Date(updateFields.data_nascimento);
    }
    if (updateFields.renda_mensal !== undefined) {
      updateFields.renda_mensal = parseFloat(updateFields.renda_mensal) || 0;
    }

    const result = await db.collection('Clientes').updateOne(query, { $set: updateFields });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
    }

    // Se o nome foi alterado, reflete nas contas vinculadas
    if (updateFields.nome && updateFields.cpf) {
      await db.collection('Contas').updateMany({ cpf: updateFields.cpf }, { $set: { titular: updateFields.nome } });
    }

    return res.json({ success: true, message: 'Cliente atualizado com sucesso!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Adicionar seguro ao array ($addToSet conforme requisito acadêmico 2.3)
router.post('/clientes/:cpf/seguros', async (req, res) => {
  try {
    const db = await getDB();
    const { seguro } = req.body;
    if (!seguro) return res.status(400).json({ success: false, error: 'Nome do seguro é obrigatório.' });

    const result = await db.collection('Clientes').updateOne(
      { cpf: req.params.cpf },
      { $addToSet: { seguros: seguro } }
    );

    return res.json({ success: true, message: 'Seguro adicionado com $addToSet (sem duplicidades).' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/clientes/:id', async (req, res) => {
  try {
    const db = await getDB();
    const objId = safeObjectId(req.params.id);
    const cliente = await db.collection('Clientes').findOne(objId ? { _id: objId } : { cpf: req.params.id });

    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });

    // Validação de relacionamentos: Contas com saldo
    const contasComSaldo = await db.collection('Contas').find({ cpf: cliente.cpf, valor: { $gt: 0 } }).toArray();
    if (contasComSaldo.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Não é possível excluir cliente com conta ativa que possua saldo positivo. Saldo total: R$ ${contasComSaldo.reduce((acc, c) => acc + c.valor, 0).toFixed(2)}`
      });
    }

    // Validação de empréstimos em aberto
    const empAtivos = await db.collection('Emprestimos').find({
      cpf_cliente: cliente.cpf,
      status: { $in: ['Ativo', 'Em Análise'] }
    }).toArray();

    if (empAtivos.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir cliente que possui empréstimos Ativos ou Em Análise.'
      });
    }

    // Remove contas zeradas do cliente e o próprio cliente
    await db.collection('Contas').deleteMany({ cpf: cliente.cpf });
    await db.collection('Clientes').deleteOne({ _id: cliente._id });

    return res.json({ success: true, message: 'Cliente e contas vinculadas sem saldo removidos com sucesso.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. CONTAS BANCÁRIAS (Listagem, Criação, Detalhes)
// -------------------------------------------------------------
router.get('/contas', async (req, res) => {
  try {
    const db = await getDB();
    const { cpf, tipo, busca } = req.query;
    const filter = {};

    if (cpf) filter.cpf = cpf;
    if (tipo) filter.tipo = tipo;
    if (busca) {
      filter.$or = [
        { numero_conta: { $regex: busca, $options: 'i' } },
        { titular: { $regex: busca, $options: 'i' } },
        { cpf: { $regex: busca, $options: 'i' } }
      ];
    }

    const contas = await db.collection('Contas').find(filter).sort({ numero_conta: 1 }).toArray();
    return res.json({ success: true, data: contas });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/contas/:numero', async (req, res) => {
  try {
    const db = await getDB();
    const conta = await db.collection('Contas').findOne({ numero_conta: req.params.numero });
    if (!conta) return res.status(404).json({ success: false, error: 'Conta não encontrada.' });

    // Buscar histórico de transações desta conta
    const extrato = await db.collection('Transacoes')
      .find({ $or: [{ conta_origem: conta.numero_conta }, { conta_destino: conta.numero_conta }] })
      .sort({ data: -1 })
      .toArray();

    return res.json({ success: true, data: { ...conta, extrato } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/contas', async (req, res) => {
  try {
    const db = await getDB();
    const { numero_conta, agencia, tipo, cpf, saldo_inicial, limite_cheque_especial } = req.body;

    if (!numero_conta || !agencia || !tipo || !cpf) {
      return res.status(400).json({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // Verificar se titular existe
    const cliente = await db.collection('Clientes').findOne({ cpf });
    if (!cliente) {
      return res.status(400).json({ success: false, error: 'CPF não cadastrado na base de clientes.' });
    }

    // Verificar unicidade da conta
    const contaExiste = await db.collection('Contas').findOne({ numero_conta });
    if (contaExiste) {
      return res.status(400).json({ success: false, error: 'Já existe uma conta com este número.' });
    }

    const saldo = parseFloat(saldo_inicial) || 0;
    const limite = parseFloat(limite_cheque_especial) || 0;

    const novaConta = {
      numero_conta,
      agencia,
      tipo,
      cpf,
      titular: cliente.nome,
      valor: saldo,
      limite_cheque_especial: tipo === 'Conta corrente' ? limite : 0,
      status: 'Ativa',
      data_abertura: new Date()
    };

    await db.collection('Contas').insertOne(novaConta);

    // Se houve saldo inicial > 0, registra a transação de abertura
    if (saldo > 0) {
      await db.collection('Transacoes').insertOne({
        id_transacao: `TRX-${Date.now().toString().slice(-6)}`,
        tipo: 'Depósito Inicial',
        natureza: 'Entrada',
        valor: saldo,
        conta_origem: numero_conta,
        conta_destino: null,
        descricao: 'Aporte de saldo inicial na abertura de conta',
        data: new Date(),
        saldo_posterior: saldo,
        status: 'Concluída'
      });
    }

    return res.status(201).json({ success: true, data: novaConta });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. TRANSAÇÕES E EXTRATO (Com consistência de saldo)
// -------------------------------------------------------------
router.get('/transacoes', async (req, res) => {
  try {
    const db = await getDB();
    const { conta, tipo, data_inicio, data_fim } = req.query;
    const filter = {};

    if (conta) {
      filter.$or = [{ conta_origem: conta }, { conta_destino: conta }];
    }
    if (tipo) {
      filter.tipo = tipo;
    }
    if (data_inicio || data_fim) {
      filter.data = {};
      if (data_inicio) filter.data.$gte = new Date(data_inicio);
      if (data_fim) filter.data.$lte = new Date(data_fim);
    }

    const transacoes = await db.collection('Transacoes').find(filter).sort({ data: -1 }).toArray();
    return res.json({ success: true, data: transacoes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Registrar movimentação financeira (Depósito, Saque, PIX/Transferência)
router.post('/transacoes', async (req, res) => {
  try {
    const db = await getDB();
    const contasCol = db.collection('Contas');
    const transacoesCol = db.collection('Transacoes');

    const { tipo, valor, conta_origem, conta_destino, descricao } = req.body;
    const valorNum = parseFloat(valor);

    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ success: false, error: 'O valor da operação deve ser maior que zero.' });
    }

    if (!conta_origem) {
      return res.status(400).json({ success: false, error: 'A conta de origem é obrigatória.' });
    }

    // Busca conta de origem
    const contaOrigemDoc = await contasCol.findOne({ numero_conta: conta_origem });
    if (!contaOrigemDoc) {
      return res.status(404).json({ success: false, error: 'Conta de origem não encontrada.' });
    }

    if (contaOrigemDoc.status !== 'Ativa') {
      return res.status(400).json({ success: false, error: 'Conta de origem está inativa ou bloqueada.' });
    }

    const idTransacao = `TRX-${Date.now().toString().slice(-6)}`;
    const agora = new Date();

    // 1. Depósito
    if (tipo === 'Depósito') {
      const novoSaldo = contaOrigemDoc.valor + valorNum;
      await contasCol.updateOne({ numero_conta: conta_origem }, { $inc: { valor: valorNum } });

      const novaTransacao = {
        id_transacao: idTransacao,
        tipo: 'Depósito',
        natureza: 'Entrada',
        valor: valorNum,
        conta_origem: conta_origem,
        conta_destino: null,
        descricao: descricao || 'Depósito em conta',
        data: agora,
        saldo_posterior: novoSaldo,
        status: 'Concluída'
      };

      await transacoesCol.insertOne(novaTransacao);
      return res.status(201).json({ success: true, message: 'Depósito realizado com sucesso!', data: novaTransacao });
    }

    // 2. Saque ou Pagamento
    if (tipo === 'Saque' || tipo === 'Pagamento') {
      const limite = contaOrigemDoc.limite_cheque_especial || 0;
      const saldoDisponivel = contaOrigemDoc.valor + limite;

      if (valorNum > saldoDisponivel) {
        return res.status(400).json({
          success: false,
          error: `Saldo insuficiente para saque. Disponível: R$ ${saldoDisponivel.toFixed(2)} (Saldo: R$ ${contaOrigemDoc.valor.toFixed(2)} + Limite: R$ ${limite.toFixed(2)})`
        });
      }

      const novoSaldo = contaOrigemDoc.valor - valorNum;
      await contasCol.updateOne({ numero_conta: conta_origem }, { $inc: { valor: -valorNum } });

      const novaTransacao = {
        id_transacao: idTransacao,
        tipo: tipo,
        natureza: 'Saída',
        valor: valorNum,
        conta_origem: conta_origem,
        conta_destino: null,
        descricao: descricao || `${tipo} realizado`,
        data: agora,
        saldo_posterior: novoSaldo,
        status: 'Concluída'
      };

      await transacoesCol.insertOne(novaTransacao);
      return res.status(201).json({ success: true, message: `${tipo} realizado com sucesso!`, data: novaTransacao });
    }

    // 3. Transferência ou PIX
    if (tipo === 'Transferência' || tipo === 'PIX') {
      if (!conta_destino) {
        return res.status(400).json({ success: false, error: 'Conta de destino é obrigatória para transferência ou PIX.' });
      }
      if (conta_origem === conta_destino) {
        return res.status(400).json({ success: false, error: 'A conta de destino não pode ser a mesma de origem.' });
      }

      const contaDestinoDoc = await contasCol.findOne({ numero_conta: conta_destino });
      if (!contaDestinoDoc) {
        return res.status(404).json({ success: false, error: 'Conta de destino não encontrada.' });
      }

      const limite = contaOrigemDoc.limite_cheque_especial || 0;
      const saldoDisponivel = contaOrigemDoc.valor + limite;

      if (valorNum > saldoDisponivel) {
        return res.status(400).json({
          success: false,
          error: `Saldo insuficiente para transferência. Disponível: R$ ${saldoDisponivel.toFixed(2)}`
        });
      }

      // Executa as atualizações coerentes de débito e crédito no MongoDB
      await contasCol.updateOne({ numero_conta: conta_origem }, { $inc: { valor: -valorNum } });
      await contasCol.updateOne({ numero_conta: conta_destino }, { $inc: { valor: valorNum } });

      const novoSaldoOrigem = contaOrigemDoc.valor - valorNum;

      const transacaoOrigem = {
        id_transacao: idTransacao,
        tipo: `${tipo} Enviado`,
        natureza: 'Saída',
        valor: valorNum,
        conta_origem: conta_origem,
        conta_destino: conta_destino,
        descricao: descricao || `${tipo} para conta ${conta_destino} (${contaDestinoDoc.titular})`,
        data: agora,
        saldo_posterior: novoSaldoOrigem,
        status: 'Concluída'
      };

      await transacoesCol.insertOne(transacaoOrigem);

      return res.status(201).json({
        success: true,
        message: `${tipo} de R$ ${valorNum.toFixed(2)} realizado com sucesso para ${contaDestinoDoc.titular}!`,
        data: transacaoOrigem
      });
    }

    return res.status(400).json({ success: false, error: `Tipo de transação desconhecido: ${tipo}` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. EMPRÉSTIMOS
// -------------------------------------------------------------
router.get('/emprestimos', async (req, res) => {
  try {
    const db = await getDB();
    const { status, cpf } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (cpf) filter.cpf_cliente = cpf;

    const emprestimos = await db.collection('Emprestimos').find(filter).sort({ data_contratacao: -1 }).toArray();
    return res.json({ success: true, data: emprestimos });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/emprestimos', async (req, res) => {
  try {
    const db = await getDB();
    const { cpf_cliente, numero_conta, valor_solicitado, prazo_meses, taxa_juros_mensal, finalidade } = req.body;

    const valorNum = parseFloat(valor_solicitado);
    const prazoNum = parseInt(prazo_meses, 10);
    const taxaNum = parseFloat(taxa_juros_mensal) || 1.95;

    if (!cpf_cliente || !numero_conta || isNaN(valorNum) || isNaN(prazoNum) || valorNum <= 0 || prazoNum <= 0) {
      return res.status(400).json({ success: false, error: 'Dados do empréstimo incompletos ou inválidos.' });
    }

    const cliente = await db.collection('Clientes').findOne({ cpf: cpf_cliente });
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
    }

    const conta = await db.collection('Contas').findOne({ numero_conta: numero_conta, cpf: cpf_cliente });
    if (!conta) {
      return res.status(404).json({ success: false, error: 'Conta bancária informada não pertence ao cliente informado.' });
    }

    // Cálculo financeiro simples (juros compostos ou tabela Price padrão)
    const i = taxaNum / 100;
    const parcela = (valorNum * i) / (1 - Math.pow(1 + i, -prazoNum));
    const totalPagar = parcela * prazoNum;

    const codigo = `EMP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const novoEmprestimo = {
      codigo_emprestimo: codigo,
      cpf_cliente,
      nome_cliente: cliente.nome,
      numero_conta,
      valor_solicitado: Math.round(valorNum * 100) / 100,
      taxa_juros_mensal: taxaNum,
      prazo_meses: prazoNum,
      valor_parcela: Math.round(parcela * 100) / 100,
      total_a_pagar: Math.round(totalPagar * 100) / 100,
      status: 'Ativo',
      finalidade: finalidade || 'Crédito Pessoal',
      parcelas_pagas: 0,
      data_contratacao: new Date(),
      proximo_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    await db.collection('Emprestimos').insertOne(novoEmprestimo);

    // O valor do empréstimo aprovado é creditado na conta do cliente via movimentação
    await db.collection('Contas').updateOne({ numero_conta }, { $inc: { valor: novoEmprestimo.valor_solicitado } });

    await db.collection('Transacoes').insertOne({
      id_transacao: `TRX-${Date.now().toString().slice(-6)}`,
      tipo: 'Crédito Empréstimo',
      natureza: 'Entrada',
      valor: novoEmprestimo.valor_solicitado,
      conta_origem: numero_conta,
      conta_destino: null,
      descricao: `Crédito de contrato de empréstimo ${codigo}`,
      data: new Date(),
      saldo_posterior: conta.valor + novoEmprestimo.valor_solicitado,
      status: 'Concluída'
    });

    return res.status(201).json({ success: true, message: 'Empréstimo contratado e creditado na conta!', data: novoEmprestimo });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Atualizar status do empréstimo (ex.: Liquidado, Cancelado)
router.patch('/emprestimos/:codigo/status', async (req, res) => {
  try {
    const db = await getDB();
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status é obrigatório.' });

    const result = await db.collection('Emprestimos').updateOne(
      { codigo_emprestimo: req.params.codigo },
      { $set: { status: status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Empréstimo não encontrado.' });
    }

    return res.json({ success: true, message: `Status alterado para '${status}'.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. RELATÓRIOS E PIPELINES DE AGREGAÇÃO MONGODB (Exigências do PDF)
// -------------------------------------------------------------
router.get('/relatorios/agregacoes', async (req, res) => {
  try {
    const db = await getDB();
    const contasCol = db.collection('Contas');
    const clientesCol = db.collection('Clientes');
    const transacoesCol = db.collection('Transacoes');
    const emprestimosCol = db.collection('Emprestimos');

    // Pipeline 4.1 do PDF: Agrupamento e Métricas Financeiras ($group, $sum, $avg, $max)
    const pipeline41 = [
      {
        $group: {
          _id: '$tipo',
          total_contas: { $sum: 1 },
          media_saldo: { $avg: '$valor' },
          maior_saldo: { $max: '$valor' },
          saldo_total_tipo: { $sum: '$valor' }
        }
      },
      { $sort: { saldo_total_tipo: -1 } }
    ];
    const resultado41 = await contasCol.aggregate(pipeline41).toArray();

    // Pipeline 4.2 do PDF: $unwind no array de seguros e $sortByCount no genero
    const pipeline42 = [
      { $unwind: '$seguros' },
      { $sortByCount: '$genero' }
    ];
    const resultado42 = await clientesCol.aggregate(pipeline42).toArray();

    // Pipeline 4.3 do PDF: $match (Conta salário com saldo > 3500) e $group
    const pipeline43 = [
      {
        $match: {
          tipo: 'Conta salário',
          valor: { $gt: 3500 }
        }
      },
      {
        $group: {
          _id: '$tipo',
          total_contas_elegiveis: { $sum: 1 },
          saldo_total: { $sum: '$valor' },
          saldo_medio: { $avg: '$valor' }
        }
      }
    ];
    const resultado43 = await contasCol.aggregate(pipeline43).toArray();

    // Pipeline 4.4 do PDF: $lookup (origem Clientes, from Contas, localField cpf, foreignField cpf)
    const pipeline44 = [
      {
        $lookup: {
          from: 'Contas',
          localField: 'cpf',
          foreignField: 'cpf',
          as: 'clientes_contas'
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
      { $limit: 5 }
    ];
    const resultado44 = await clientesCol.aggregate(pipeline44).toArray();

    // Agregação adicional de Transações por Natureza e Tipo
    const transacoesPorTipo = await transacoesCol.aggregate([
      {
        $group: {
          _id: '$tipo',
          totalTransacoes: { $sum: 1 },
          volumeTotal: { $sum: '$valor' }
        }
      },
      { $sort: { volumeTotal: -1 } }
    ]).toArray();

    // Agregação de Empréstimos por Status
    const emprestimosPorStatus = await emprestimosCol.aggregate([
      {
        $group: {
          _id: '$status',
          quantidade: { $sum: 1 },
          totalSolicitado: { $sum: '$valor_solicitado' },
          totalReceber: { $sum: '$total_a_pagar' }
        }
      }
    ]).toArray();

    return res.json({
      success: true,
      data: {
        item41: {
          descricao: 'Item 4.1: $group por tipo com total, média ($avg) e maior saldo ($max)',
          pipeline: pipeline41,
          resultado: resultado41
        },
        item42: {
          descricao: 'Item 4.2: $unwind em seguros e $sortByCount no genero',
          pipeline: pipeline42,
          resultado: resultado42
        },
        item43: {
          descricao: 'Item 4.3: $match (Conta salário com saldo > 3500) e $group',
          pipeline: pipeline43,
          resultado: resultado43
        },
        item44: {
          descricao: 'Item 4.4: $lookup Clientes e Contas com $project e $limit 5',
          pipeline: pipeline44,
          resultado: resultado44
        },
        transacoesPorTipo,
        emprestimosPorStatus
      }
    });
  } catch (err) {
    console.error('[API /relatorios/agregacoes]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
