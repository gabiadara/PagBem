// public/js/app.js

const API_BASE = '/api';

// Formatadores
const formatBRL = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Toast de notificações
function showToast(msg, type = 'success') {
  const container = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> <div>${msg}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4500);
}

// Navegação entre abas
function navigateTo(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  const targetSec = document.getElementById(`view-${viewId}`);
  if (targetSec) targetSec.classList.add('active');

  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) navItem.classList.add('active');

  // Atualiza títulos
  const titles = {
    dashboard: { t: 'Dashboard Bancário', s: 'Visão executiva em tempo real com dados agregados do MongoDB' },
    clientes: { t: 'Gestão de Clientes', s: 'Cadastro e manutenção da coleção Clientes no MongoDB' },
    contas: { t: 'Contas Bancárias', s: 'Gestão de contas, tipos, agências e limites' },
    transacoes: { t: 'Movimentações e Extrato', s: 'Lançamento de depósitos, saques, PIX e histórico financeiro' },
    emprestimos: { t: 'Contratos de Empréstimos', s: 'Gestão de créditos concedidos e amortizações' },
    relatorios: { t: 'Relatórios & Pipelines de Agregação', s: 'Execução de queries complexas no MongoDB: $group, $sum, $avg, $unwind, $lookup' }
  };

  if (titles[viewId]) {
    document.getElementById('page-title').innerText = titles[viewId].t;
    document.getElementById('page-subtitle').innerText = titles[viewId].s;
  }

  // Carrega dados da aba
  if (viewId === 'dashboard') loadDashboard();
  if (viewId === 'clientes') loadClientes();
  if (viewId === 'contas') loadContas();
  if (viewId === 'transacoes') loadTransacoes();
  if (viewId === 'emprestimos') loadEmprestimos();
  if (viewId === 'relatorios') loadRelatorios();
}

// -------------------------------------------------------------------
// 1. CARREGAMENTO DO DASHBOARD
// -------------------------------------------------------------------
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const d = json.data;
    document.getElementById('dash-total-clientes').innerText = d.totalClientes;
    document.getElementById('dash-total-contas').innerText = d.totalContas;
    document.getElementById('dash-saldo-total').innerText = formatBRL(d.saldoTotal);
    document.getElementById('dash-saldo-medio').innerText = formatBRL(d.saldoMedio);
    document.getElementById('dash-total-transacoes').innerText = d.totalTransacoes;
    document.getElementById('dash-total-emprestimos').innerText = d.totalEmprestimos;
    document.getElementById('dash-volume-emprestado').innerText = formatBRL(d.totalEmprestado);
    document.getElementById('dash-maior-saldo').innerText = formatBRL(d.maiorSaldo);

    // Tabela por Tipo de Conta
    const tbodyTipos = document.getElementById('dash-tabela-tipos');
    tbodyTipos.innerHTML = '';
    d.contasPorTipo.forEach(tipo => {
      tbodyTipos.innerHTML += `
        <tr>
          <td><b>${tipo._id}</b></td>
          <td><span class="badge badge-primary">${tipo.totalContas} conta(s)</span></td>
          <td style="color: #10b981; font-weight: 600;">${formatBRL(tipo.saldoAcumulado)}</td>
          <td>${formatBRL(tipo.saldoMedio)}</td>
          <td style="font-weight: 600;">${formatBRL(tipo.maiorSaldo)}</td>
        </tr>
      `;
    });

    // Tabela Últimas Transações
    const tbodyTrx = document.getElementById('dash-tabela-transacoes');
    tbodyTrx.innerHTML = '';
    d.ultimasTransacoes.forEach(t => {
      const isEntrada = t.natureza === 'Entrada';
      tbodyTrx.innerHTML += `
        <tr>
          <td><code>${t.id_transacao}</code></td>
          <td>${formatDate(t.data)}</td>
          <td><span class="badge ${isEntrada ? 'badge-success' : 'badge-warning'}">${t.tipo}</span></td>
          <td><b>${t.conta_origem}</b></td>
          <td>${t.descricao || '-'}</td>
          <td style="color: ${isEntrada ? '#10b981' : '#ef4444'}; font-weight: 700;">
            ${isEntrada ? '+' : '-'} ${formatBRL(t.valor)}
          </td>
          <td><span class="badge badge-success">${t.status}</span></td>
        </tr>
      `;
    });
  } catch (err) {
    showToast(`Erro ao carregar dashboard: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------------
// 2. CLIENTES
// -------------------------------------------------------------------
async function loadClientes() {
  try {
    const busca = document.getElementById('filtro-cliente-busca').value;
    const res = await fetch(`${API_BASE}/clientes?busca=${encodeURIComponent(busca)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const tbody = document.getElementById('tabela-clientes');
    tbody.innerHTML = '';

    if (json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">Nenhum cliente cadastrado.</td></tr>';
      return;
    }

    json.data.forEach(c => {
      const segurosBadges = (c.seguros || []).map(s => `<span class="badge badge-primary" style="margin: 2px;">${s}</span>`).join(' ') || '<span style="opacity: 0.5;">Nenhum</span>';

      tbody.innerHTML += `
        <tr>
          <td><b>${c.nome}</b></td>
          <td><code>${c.cpf}</code></td>
          <td>${c.profissao || '-'}</td>
          <td>${c.genero || '-'}</td>
          <td>${c.status_civil || '-'}</td>
          <td>${formatBRL(c.renda_mensal)}</td>
          <td>${segurosBadges}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="adicionarSeguro('${c.cpf}')" title="Adicionar Seguro com $addToSet">+ Seguro</button>
            <button class="btn btn-danger btn-sm" onclick="excluirCliente('${c._id}')">Excluir</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    showToast(`Erro ao carregar clientes: ${err.message}`, 'error');
  }
}

async function adicionarSeguro(cpf) {
  const seguro = prompt('Digite o nome do seguro para adicionar via $addToSet (ex: seguro residencial):');
  if (!seguro) return;
  try {
    const res = await fetch(`${API_BASE}/clientes/${cpf}/seguros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seguro })
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message);
      loadClientes();
    } else {
      showToast(json.error, 'error');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function excluirCliente(id) {
  if (!confirm('Deseja realmente excluir este cliente do MongoDB? (O sistema valida saldo e empréstimos)')) return;
  try {
    const res = await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast(json.message);
      loadClientes();
      loadDashboard();
    } else {
      showToast(json.error, 'error');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// -------------------------------------------------------------------
// 3. CONTAS
// -------------------------------------------------------------------
async function loadContas() {
  try {
    const tipo = document.getElementById('filtro-conta-tipo').value;
    const res = await fetch(`${API_BASE}/contas?tipo=${encodeURIComponent(tipo)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const tbody = document.getElementById('tabela-contas');
    tbody.innerHTML = '';

    if (json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9">Nenhuma conta cadastrada.</td></tr>';
      return;
    }

    json.data.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td><b>${c.numero_conta}</b></td>
          <td>${c.agencia}</td>
          <td>${c.titular}</td>
          <td><code>${c.cpf}</code></td>
          <td><span class="badge badge-primary">${c.tipo}</span></td>
          <td>${formatBRL(c.limite_cheque_especial)}</td>
          <td style="color: ${c.valor >= 0 ? '#10b981' : '#ef4444'}; font-weight: 700;">
            ${formatBRL(c.valor)}
          </td>
          <td><span class="badge badge-success">${c.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="verExtratoConta('${c.numero_conta}')">Extrato</button>
            <button class="btn btn-success btn-sm" onclick="abrirTransacaoParaConta('${c.numero_conta}')">Movimentar</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    showToast(`Erro ao carregar contas: ${err.message}`, 'error');
  }
}

function verExtratoConta(numConta) {
  document.getElementById('filtro-transacao-conta').value = numConta;
  navigateTo('transacoes');
}

function abrirTransacaoParaConta(numConta) {
  document.getElementById('trx-origem').value = numConta;
  document.getElementById('modal-transacao').classList.add('active');
}

// -------------------------------------------------------------------
// 4. TRANSAÇÕES / EXTRATO
// -------------------------------------------------------------------
async function loadTransacoes() {
  try {
    const conta = document.getElementById('filtro-transacao-conta').value;
    const tipo = document.getElementById('filtro-transacao-tipo').value;
    const res = await fetch(`${API_BASE}/transacoes?conta=${encodeURIComponent(conta)}&tipo=${encodeURIComponent(tipo)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const tbody = document.getElementById('tabela-transacoes');
    tbody.innerHTML = '';

    if (json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9">Nenhuma movimentação encontrada para os filtros.</td></tr>';
      return;
    }

    json.data.forEach(t => {
      const isEntrada = t.natureza === 'Entrada';
      tbody.innerHTML += `
        <tr>
          <td><code>${t.id_transacao}</code></td>
          <td>${formatDate(t.data)}</td>
          <td><span class="badge ${isEntrada ? 'badge-success' : 'badge-warning'}">${t.tipo}</span></td>
          <td><span class="badge ${isEntrada ? 'badge-success' : 'badge-danger'}">${t.natureza}</span></td>
          <td><b>${t.conta_origem}</b></td>
          <td>${t.conta_destino || '-'}</td>
          <td>${t.descricao || '-'}</td>
          <td style="color: ${isEntrada ? '#10b981' : '#ef4444'}; font-weight: 700;">
            ${isEntrada ? '+' : '-'} ${formatBRL(t.valor)}
          </td>
          <td style="font-weight: 600;">${formatBRL(t.saldo_posterior)}</td>
        </tr>
      `;
    });
  } catch (err) {
    showToast(`Erro ao carregar extrato: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------------
// 5. EMPRÉSTIMOS
// -------------------------------------------------------------------
async function loadEmprestimos() {
  try {
    const res = await fetch(`${API_BASE}/emprestimos`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const tbody = document.getElementById('tabela-emprestimos');
    tbody.innerHTML = '';

    if (json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11">Nenhum empréstimo registrado.</td></tr>';
      return;
    }

    json.data.forEach(e => {
      const statusBadge = e.status === 'Ativo' ? 'badge-success' : e.status === 'Liquidado' ? 'badge-primary' : 'badge-warning';

      tbody.innerHTML += `
        <tr>
          <td><code>${e.codigo_emprestimo}</code></td>
          <td><b>${e.nome_cliente}</b></td>
          <td><code>${e.cpf_cliente}</code></td>
          <td>${e.numero_conta}</td>
          <td style="font-weight: 600; color: #60a5fa;">${formatBRL(e.valor_solicitado)}</td>
          <td>${e.taxa_juros_mensal}% a.m.</td>
          <td>${e.prazo_meses} meses</td>
          <td>${formatBRL(e.valor_parcela)}</td>
          <td>${formatBRL(e.total_a_pagar)}</td>
          <td><span class="badge ${statusBadge}">${e.status}</span></td>
          <td>
            ${e.status === 'Ativo' ? `<button class="btn btn-secondary btn-sm" onclick="liquidarEmprestimo('${e.codigo_emprestimo}')">Liquidar</button>` : '-'}
          </td>
        </tr>
      `;
    });
  } catch (err) {
    showToast(`Erro ao carregar empréstimos: ${err.message}`, 'error');
  }
}

async function liquidarEmprestimo(codigo) {
  if (!confirm(`Confirma a liquidação do empréstimo ${codigo}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/emprestimos/${codigo}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Liquidado' })
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message);
      loadEmprestimos();
      loadDashboard();
    } else {
      showToast(json.error, 'error');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// -------------------------------------------------------------------
// 6. RELATÓRIOS & AGREGAÇÕES MONGODB
// -------------------------------------------------------------------
async function loadRelatorios() {
  try {
    const res = await fetch(`${API_BASE}/relatorios/agregacoes`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const d = json.data;

    // 4.1
    const t41 = document.getElementById('tabela-req-41');
    t41.innerHTML = '';
    d.item41.resultado.forEach(r => {
      t41.innerHTML += `
        <tr>
          <td><b>${r._id}</b></td>
          <td><span class="badge badge-primary">${r.total_contas} contas</span></td>
          <td style="color: #60a5fa; font-weight: 600;">${formatBRL(r.media_saldo)}</td>
          <td style="font-weight: 600;">${formatBRL(r.maior_saldo)}</td>
          <td style="color: #10b981; font-weight: 700;">${formatBRL(r.saldo_total_tipo)}</td>
        </tr>
      `;
    });
    document.getElementById('code-req-41').innerText = `// Pipeline 4.1:\n` + JSON.stringify(d.item41.pipeline, null, 2);

    // 4.2
    const t42 = document.getElementById('tabela-req-42');
    t42.innerHTML = '';
    d.item42.resultado.forEach(r => {
      t42.innerHTML += `
        <tr>
          <td><b>${r._id}</b></td>
          <td><span class="badge badge-success">${r.count} seguro(s) contratado(s)</span></td>
        </tr>
      `;
    });
    document.getElementById('code-req-42').innerText = `// Pipeline 4.2:\n` + JSON.stringify(d.item42.pipeline, null, 2);

    // 4.3
    const t43 = document.getElementById('tabela-req-43');
    t43.innerHTML = '';
    if (d.item43.resultado.length === 0) {
      t43.innerHTML = '<tr><td colspan="4">Nenhuma conta salário com saldo > 3500.</td></tr>';
    } else {
      d.item43.resultado.forEach(r => {
        t43.innerHTML += `
          <tr>
            <td><b>Conta salário (Saldo > R$ 3.500,00)</b></td>
            <td><span class="badge badge-warning">${r.total_contas_elegiveis} conta(s)</span></td>
            <td style="color: #10b981; font-weight: 700;">${formatBRL(r.saldo_total)}</td>
            <td>${formatBRL(r.saldo_medio)}</td>
          </tr>
        `;
      });
    }
    document.getElementById('code-req-43').innerText = `// Pipeline 4.3:\n` + JSON.stringify(d.item43.pipeline, null, 2);

    // 4.4
    const t44 = document.getElementById('tabela-req-44');
    t44.innerHTML = '';
    d.item44.resultado.forEach(r => {
      const contasHtml = (r.clientes_contas || []).map(c =>
        `<div>• Conta: <b>${c.numero_conta}</b> (${c.tipo}) - Saldo: <b style="color: #10b981;">${formatBRL(c.valor)}</b></div>`
      ).join('') || '<span style="opacity: 0.5;">Nenhuma conta vinculada</span>';

      t44.innerHTML += `
        <tr>
          <td><b>${r.nome}</b></td>
          <td><code>${r.cpf}</code></td>
          <td>${r.email || '-'}</td>
          <td>${contasHtml}</td>
        </tr>
      `;
    });
    document.getElementById('code-req-44').innerText = `// Pipeline 4.4:\n` + JSON.stringify(d.item44.pipeline, null, 2);

  } catch (err) {
    showToast(`Erro ao carregar relatórios: ${err.message}`, 'error');
  }
}

// -------------------------------------------------------------------
// CONTROLES DE MODAIS E FORMULÁRIOS
// -------------------------------------------------------------------
function fecharModais() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

document.addEventListener('DOMContentLoaded', () => {
  // Navegação Menu
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      navigateTo(view);
    });
  });

  // Botões de Abertura de Modal
  document.getElementById('btn-novo-cliente')?.addEventListener('click', () => {
    document.getElementById('form-cliente').reset();
    document.getElementById('modal-cliente').classList.add('active');
  });

  document.getElementById('btn-nova-conta')?.addEventListener('click', () => {
    document.getElementById('form-conta').reset();
    document.getElementById('modal-conta').classList.add('active');
  });

  document.getElementById('btn-nova-transacao')?.addEventListener('click', () => {
    document.getElementById('form-transacao').reset();
    document.getElementById('modal-transacao').classList.add('active');
  });

  document.getElementById('btn-novo-emprestimo')?.addEventListener('click', () => {
    document.getElementById('form-emprestimo').reset();
    document.getElementById('modal-emprestimo').classList.add('active');
  });

  // Filtros
  document.getElementById('filtro-cliente-busca')?.addEventListener('input', () => loadClientes());
  document.getElementById('filtro-conta-tipo')?.addEventListener('change', () => loadContas());
  document.getElementById('btn-filtrar-transacoes')?.addEventListener('click', () => loadTransacoes());

  // Recarregar Seed
  document.getElementById('btn-seed')?.addEventListener('click', async () => {
    if (!confirm('Deseja reinicializar o banco com a massa de dados padrão de demonstração?')) return;
    try {
      showToast('Reinicializando banco de dados...', 'info');
      const res = await fetch(`${API_BASE}/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Dados de demonstração recarregados com sucesso!');
        loadDashboard();
      } else {
        showToast(json.error, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  // Submit Formulário de Cliente
  document.getElementById('form-cliente')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const segurosRaw = document.getElementById('cli-seguros').value;
    const seguros = segurosRaw ? segurosRaw.split(',').map(s => s.trim()).filter(s => s) : [];

    const payload = {
      nome: document.getElementById('cli-nome').value,
      cpf: document.getElementById('cli-cpf').value,
      email: document.getElementById('cli-email').value,
      telefone: document.getElementById('cli-telefone').value,
      genero: document.getElementById('cli-genero').value,
      status_civil: document.getElementById('cli-civil').value,
      profissao: document.getElementById('cli-profissao').value,
      renda_mensal: parseFloat(document.getElementById('cli-renda').value) || 0,
      seguros: seguros
    };

    try {
      const res = await fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast('Cliente cadastrado com sucesso no MongoDB!');
        fecharModais();
        loadClientes();
        loadDashboard();
      } else {
        showToast(json.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Submit Formulário de Conta
  document.getElementById('form-conta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      cpf: document.getElementById('conta-cpf').value,
      numero_conta: document.getElementById('conta-numero').value,
      agencia: document.getElementById('conta-agencia').value,
      tipo: document.getElementById('conta-tipo').value,
      saldo_inicial: parseFloat(document.getElementById('conta-saldo-inicial').value) || 0,
      limite_cheque_especial: parseFloat(document.getElementById('conta-limite').value) || 0
    };

    try {
      const res = await fetch(`${API_BASE}/contas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast('Conta bancária aberta com sucesso no MongoDB!');
        fecharModais();
        loadContas();
        loadDashboard();
      } else {
        showToast(json.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Submit Formulário de Transação
  document.getElementById('form-transacao')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      tipo: document.getElementById('trx-tipo').value,
      valor: parseFloat(document.getElementById('trx-valor').value) || 0,
      conta_origem: document.getElementById('trx-origem').value,
      conta_destino: document.getElementById('trx-destino').value,
      descricao: document.getElementById('trx-descricao').value
    };

    try {
      const res = await fetch(`${API_BASE}/transacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fecharModais();
        loadTransacoes();
        loadContas();
        loadDashboard();
      } else {
        showToast(json.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Submit Formulário de Empréstimo
  document.getElementById('form-emprestimo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      cpf_cliente: document.getElementById('emp-cpf').value,
      numero_conta: document.getElementById('emp-conta').value,
      valor_solicitado: parseFloat(document.getElementById('emp-valor').value) || 0,
      prazo_meses: parseInt(document.getElementById('emp-prazo').value, 10),
      taxa_juros_mensal: parseFloat(document.getElementById('emp-taxa').value) || 1.85,
      finalidade: document.getElementById('emp-finalidade').value
    };

    try {
      const res = await fetch(`${API_BASE}/emprestimos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fecharModais();
        loadEmprestimos();
        loadContas();
        loadDashboard();
      } else {
        showToast(json.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Inicialização inicial da tela
  loadDashboard();
});
