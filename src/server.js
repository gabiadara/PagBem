// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db/connection');
const { seedDatabase } = require('./db/seed');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático moderno
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api', apiRoutes);

// Fallback para rota inicial
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicialização do Servidor e Banco
async function startServer() {
  try {
    console.log('----------------------------------------------------');
    console.log(' SISTEMA DE GESTÃO BANCÁRIA & CONTAS FINANCEIRAS');
    console.log(' Disciplina: Banco de Dados / NoSQL - Trabalho Prático');
    console.log('----------------------------------------------------');

    // Conecta ao MongoDB real
    await connectDB();

    // Executa auto-seed se o banco estiver vazio
    await seedDatabase({ reset: false });

    app.listen(PORT, () => {
      console.log(`[Servidor] Aplicação no ar com sucesso!`);
      console.log(`[Acesso Web] http://localhost:${PORT}`);
      console.log(`[API Status] http://localhost:${PORT}/api/dashboard`);
      console.log('----------------------------------------------------');
    });
  } catch (err) {
    console.error('[Servidor] Erro ao iniciar a aplicação:', err);
    process.exit(1);
  }
}

startServer();
