# PagBem - Sistema de Gestão Bancária & NoSQL MongoDB
**Trabalho Prático da Disciplina de Banco de Dados / NoSQL**  
**Instituto Federal de Santa Catarina (IFSC) - Câmpus Gaspar**  

---

## 🎯 Sobre o Projeto
Este projeto consiste na implementação completa de um sistema bancário corporativo integrado de verdade ao **MongoDB**, acompanhado da resolução acadêmica de todas as questões do edital (Conceitos NoSQL, CRUD, consultas `find` avançadas e pipelines de agregação `aggregate`).

### Coleções do Sistema:
1. `Clientes`: Cadastro completo, renda, dependentes e matriz de seguros contratados.
2. `Contas`: Contas corrente, poupança e salário, agência, limite e saldo.
3. `Transacoes`: Extrato contábil com débitos, créditos, transferências, PIX e saldo posterior.
4. `Emprestimos`: Contratos de financiamento com taxas de juros mensais, prazos e amortização.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js instalado (versão 18 ou superior).
- *(Opcional)* MongoDB local instalado ou conexão com MongoDB Atlas. O sistema possui contingência automática para carregar uma instância nativa do MongoDB em memória caso não haja uma instância externa ativa.

### 2. Instalação das Dependências
No terminal do projeto (na pasta `trabalhoBancodeDados`), execute:
```bash
npm install
```

### 3. Iniciar o Servidor
Execute o comando:
```bash
npm start
```
Ou diretamente:
```bash
node src/server.js
```

### 4. Acessar a Aplicação
Abra o navegador no endereço:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Como Executar os Testes Automatizados

O projeto possui uma bateria de testes automatizados que valida todas as operações do MongoDB exigidas:
- Criação e consulta de clientes
- Abertura de contas
- Lançamento de depósitos, saques e transferências com validação de saldo/limite
- Contratação de empréstimos e crédito em conta
- Execução dos 4 pipelines de agregação acadêmicos (`$group`, `$sum`, `$avg`, `$unwind`, `$sortByCount`, `$match`, `$lookup`)

Para rodar os testes:
```bash
npm test
```

---

## 📁 Estrutura de Arquivos
```
trabalhoBancodeDados/
│
├── public/                     # Frontend moderno (SPA)
│   ├── css/
│   │   └── style.css           # Design responsivo moderno (Dark Glass)
│   ├── js/
│   │   └── app.js              # Lógica de integração assíncrona (Fetch API)
│   └── index.html              # Interface do Dashboard, Clientes, Contas, Extrato e Relatórios
│
├── src/                        # Backend Node.js
│   ├── db/
│   │   ├── connection.js       # Conexão resiliente com MongoDB
│   │   └── seed.js             # Carga inicial de dados de demonstração
│   ├── routes/
│   │   └── api.js              # Endpoints REST e Pipelines de Agregação
│   └── server.js               # Ponto de entrada do servidor Express
│
├── test/
│   └── app.test.js             # Testes automatizados de todas as operações
│
├── scripts_mongosh.js          # Scripts Mongosh oficiais para o MongoDB Compass
├── TRABALHO_ACADEMICO.md       # Documento acadêmico completo com respostas teóricas e práticas
├── package.json                # Configurações e dependências
├── .env.example                # Exemplo de variáveis de ambiente
├── .env                        # Variáveis de ambiente configuradas
└── README.md                   # Instruções de uso e documentação
```

---

## 📊 Endpoints da API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard` | Indicadores consolidados calculados via `$group`, `$sum` e `$avg` |
| `GET` | `/api/clientes` | Lista todos os clientes com filtros de busca |
| `POST` | `/api/clientes` | Cadastra novo cliente no MongoDB |
| `DELETE` | `/api/clientes/:id` | Exclui cliente com validação de saldo e empréstimos ativos |
| `POST` | `/api/clientes/:cpf/seguros` | Adiciona seguro ao array via `$addToSet` |
| `GET` | `/api/contas` | Lista contas com filtro por tipo |
| `POST` | `/api/contas` | Abertura de conta bancária |
| `GET` | `/api/transacoes` | Extrato de movimentações financeiras |
| `POST` | `/api/transacoes` | Registro consistente de Depósito, Saque ou PIX |
| `GET` | `/api/emprestimos` | Lista contratos de empréstimo |
| `POST` | `/api/emprestimos` | Contratação de empréstimo com crédito em conta |
| `GET` | `/api/relatorios/agregacoes`| Executa e exibe os 4 pipelines acadêmicos do trabalho |
| `POST` | `/api/seed` | Reinicializa o banco com dados de demonstração |
