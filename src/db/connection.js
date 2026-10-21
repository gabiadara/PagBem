// src/db/connection.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

let client = null;
let dbInstance = null;
let mongodServer = null;

async function connectDB() {
  if (dbInstance) return dbInstance;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'banco_corporativo';

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[DB] Tentando conexão com MongoDB em: ${uri}`);
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      dbInstance = client.db(dbName);
      console.log(`[DB] Conectado com sucesso ao MongoDB via URI no banco '${dbName}'.`);
      return dbInstance;
    } catch (err) {
      console.warn(`[DB] Não foi possível conectar ao MongoDB configurado (${err.message}).`);
      console.log(`[DB] Inicializando MongoDB local autônomo em memória (mongodb-memory-server)...`);
    }
  }

  // Fallback transparente: sobe instância real de MongoDB (processo binário nativo do MongoDB)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodServer = await MongoMemoryServer.create({
      instance: {
        dbName: dbName
      }
    });
    const memoryUri = mongodServer.getUri();
    console.log(`[DB] Servidor MongoDB autônomo iniciado em: ${memoryUri}`);
    client = new MongoClient(memoryUri);
    await client.connect();
    dbInstance = client.db(dbName);
    console.log(`[DB] Conexão estabelecida com MongoDB real local no banco '${dbName}'.`);
    return dbInstance;
  } catch (memErr) {
    console.error(`[DB] Erro crítico ao inicializar MongoDB: ${memErr.message}`);
    throw memErr;
  }
}

async function getDB() {
  if (!dbInstance) {
    return await connectDB();
  }
  return dbInstance;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
  }
  if (mongodServer) {
    await mongodServer.stop();
    mongodServer = null;
  }
  console.log('[DB] Conexões encerradas.');
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};
