/**
 * CLUSTER PRODUTOS COM FAILOVER AUTOMÁTICO
 * 
 * 3 Instâncias do mesmo serviço (Produtos)
 * - 1 LÍDER (recebe writes)
 * - 2 RÉPLICAS (apenas leitura, backup)
 * 
 * Se LÍDER cai, uma RÉPLICA vira novo LÍDER automaticamente
 */

const express = require('express');
const { DistributedRPCClient } = require('./distributed-rpc');

console.log(`
╔════════════════════════════════════════════════════════════╗
║        CLUSTER PRODUTOS COM FAILOVER AUTOMÁTICO             ║
║                                                            ║
║  3 Instâncias do mesmo serviço                             ║
║  ├─ Produtos-1 (3002) - pode ser LÍDER                     ║
║  ├─ Produtos-2 (3003) - pode ser LÍDER                     ║
║  └─ Produtos-3 (3004) - pode ser LÍDER                     ║
║                                                            ║
║  Eleição de Líder (Bully Algorithm)                        ║
║  └─ Maior ID = Líder                                       ║
╚════════════════════════════════════════════════════════════╝

📚 ARQUITETURA:

         ┌──────────────────────────┐
         │   ORQUESTRADOR (9000)    │
         │   Bully Election         │
         └──────────────────────────┘
              │        │        │
              │        │        │
    ┌─────────▼─┐  ┌──▼──────┐ ┌──▼──────┐
    │ Produtos  │  │Produtos │ │Produtos │
    │    v1     │  │   v2    │ │   v3    │
    │  3002     │  │  3003   │ │  3004   │
    │  ID=3     │  │  ID=2   │ │  ID=1   │
    │  LÍDER    │  │ RÉPLICA │ │ RÉPLICA │
    └───────────┘  └─────────┘ └─────────┘
         ▲
         │ Lê/Escreve
    Cliente API

Quando v1 (3002) cai:
├─ v2 (3003, ID=2) vs v3 (3004, ID=1)
├─ Eleição: 2 > 1
└─ v2 vira novo LÍDER

═════════════════════════════════════════════════════════════
`);

// ========================================
// CONFIGURAÇÃO POR INSTÂNCIA
// ========================================

const INSTANCIA = process.env.INSTANCIA || '1';
const CONFIGS = {
  '1': { port: 3002, serviceId: 3, name: 'Produtos-1' },  // ID=3 (maior, será LÍDER)
  '2': { port: 3003, serviceId: 2, name: 'Produtos-2' },  // ID=2
  '3': { port: 3004, serviceId: 1, name: 'Produtos-3' }   // ID=1
};

const config = CONFIGS[INSTANCIA];

console.log(`\n🚀 Iniciando ${config.name} (Porta ${config.port}, ID=${config.serviceId})\n`);

// ========================================
// BANCO DE DADOS COMPARTILHADO (simulado)
// ========================================

const database = {
  produtos: [
    { _id: '1', nome: 'Sushi', preco: 45.90, estoque: 100 },
    { _id: '2', nome: 'X-Burger', preco: 32.50, estoque: 50 },
    { _id: '3', nome: 'Coca Cola', preco: 5.00, estoque: 200 }
  ]
};

// ========================================
// CLIENTE RPC
// ========================================

const rpcClient = new DistributedRPCClient(
  'Produtos',           // Nome do serviço (todas as instâncias têm mesmo nome!)
  config.port,          // Porta específica
  config.serviceId      // ID DIFERENTE (para eleição)
);

console.log(`📝 Registrando endpoints RPC para ${config.name}...\n`);

// ========================================
// REGISTRAR ENDPOINTS RPC
// ========================================

rpcClient.registerEndpoint('listar_produtos', async (params) => {
  console.log(`   RPC: listar_produtos chamada`);
  return { sucesso: true, produtos: database.produtos };
});

rpcClient.registerEndpoint('obter_produto', async (params) => {
  console.log(`   RPC: obter_produto(${params.id})`);
  const produto = database.produtos.find(p => p._id === params.id);
  return { sucesso: !!produto, produto };
});

rpcClient.registerEndpoint('criar_produto', async (params) => {
  console.log(`   RPC: criar_produto(${params.nome})`);
  
  // Apenas o LÍDER pode escrever
  if (!rpcClient.isLeader) {
    return {
      sucesso: false,
      erro: `Esta é uma RÉPLICA (${config.name}). Apenas o LÍDER pode criar produtos.`
    };
  }

  const novo = {
    _id: String(Date.now()),
    nome: params.nome,
    preco: params.preco,
    estoque: params.estoque || 0
  };
  
  database.produtos.push(novo);
  console.log(`   ✅ Produto criado: ${novo._id}`);
  
  // Replicar para outras instâncias
  // (aqui seria sincronização entre réplicas)
  
  return { sucesso: true, produto: novo };
});

rpcClient.registerEndpoint('atualizar_produto', async (params) => {
  console.log(`   RPC: atualizar_produto(${params.id})`);
  
  if (!rpcClient.isLeader) {
    return {
      sucesso: false,
      erro: `Esta é uma RÉPLICA (${config.name}). Apenas o LÍDER pode atualizar produtos.`
    };
  }

  const idx = database.produtos.findIndex(p => p._id === params.id);
  if (idx === -1) {
    return { sucesso: false, erro: 'Produto não encontrado' };
  }

  database.produtos[idx] = { ...database.produtos[idx], ...params.dados };
  return { sucesso: true, produto: database.produtos[idx] };
});

rpcClient.registerEndpoint('deletar_produto', async (params) => {
  console.log(`   RPC: deletar_produto(${params.id})`);
  
  if (!rpcClient.isLeader) {
    return {
      sucesso: false,
      erro: `Esta é uma RÉPLICA (${config.name}). Apenas o LÍDER pode deletar produtos.`
    };
  }

  const idx = database.produtos.findIndex(p => p._id === params.id);
  if (idx === -1) {
    return { sucesso: false, erro: 'Produto não encontrado' };
  }

  database.produtos.splice(idx, 1);
  return { sucesso: true };
});

// ========================================
// CONECTAR AO ORQUESTRADOR
// ========================================

console.log(`🔌 Conectando ao Orquestrador (9000)...\n`);

rpcClient.connect('http://localhost:9000')
  .then(() => {
    console.log(`✅ ${config.name} Conectado!\n`);
  })
  .catch((error) => {
    console.log(`⚠️  ${config.name} NÃO conseguiu conectar ao orquestrador`);
    console.log(`   Continuando em modo local (isolado)\n`);
  });

// ========================================
// APLICAÇÃO EXPRESS
// ========================================

const app = express();
app.use(express.json());

// ========================================
// MIDDLEWARE: Mostrar status
// ========================================

app.use((req, res, next) => {
  const status = rpcClient.getStatus();
  
  // Adiciona header com informação de instância
  res.set({
    'X-Instancia': config.name,
    'X-Porta': config.port,
    'X-ID': config.serviceId,
    'X-Conectado': status.isConnected ? 'sim' : 'nao'
  });
  
  next();
});

// ========================================
// ROTAS GET (LEITURA - Todas podem fazer)
// ========================================

app.get('/api/produtos', (req, res) => {
  console.log(`\n[${config.name}] GET /api/produtos`);
  res.json({
    sucesso: true,
    produtos: database.produtos,
    instancia: config.name,
    estado: 'leitura OK (qualquer uma pode ler)'
  });
});

app.get('/api/produtos/:id', (req, res) => {
  console.log(`\n[${config.name}] GET /api/produtos/${req.params.id}`);
  const produto = database.produtos.find(p => p._id === req.params.id);
  
  if (!produto) {
    return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado' });
  }
  
  res.json({
    sucesso: true,
    produto,
    instancia: config.name
  });
});

// ========================================
// ROTAS POST/PUT/DELETE (ESCRITA - Apenas LÍDER)
// ========================================

app.post('/api/produtos', (req, res) => {
  console.log(`\n[${config.name}] POST /api/produtos`);
  
  // Verificar se é LÍDER
  if (!rpcClient.isLeader) {
    console.log(`   ❌ Não sou LÍDER! Redirecionando...`);
    return res.status(503).json({
      sucesso: false,
      erro: `${config.name} é uma RÉPLICA, não pode escrever`,
      mensagem: `Envie a requisição para o LÍDER (Produtos-1, porta 3002)`,
      instancia: config.name
    });
  }

  console.log(`   ✅ Sou LÍDER! Aceitando escrita...`);
  
  const { nome, preco, estoque } = req.body;
  const novo = {
    _id: String(Date.now()),
    nome,
    preco,
    estoque: estoque || 0
  };
  
  database.produtos.push(novo);
  
  res.status(201).json({
    sucesso: true,
    produto: novo,
    instancia: config.name,
    mensagem: `Criado pelo LÍDER ${config.name}`
  });
});

app.put('/api/produtos/:id', (req, res) => {
  console.log(`\n[${config.name}] PUT /api/produtos/${req.params.id}`);
  
  if (!rpcClient.isLeader) {
    return res.status(503).json({
      sucesso: false,
      erro: `${config.name} é uma RÉPLICA, não pode escrever`,
      instancia: config.name
    });
  }

  const idx = database.produtos.findIndex(p => p._id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado' });
  }

  database.produtos[idx] = { ...database.produtos[idx], ...req.body };
  
  res.json({
    sucesso: true,
    produto: database.produtos[idx],
    instancia: config.name
  });
});

app.delete('/api/produtos/:id', (req, res) => {
  console.log(`\n[${config.name}] DELETE /api/produtos/${req.params.id}`);
  
  if (!rpcClient.isLeader) {
    return res.status(503).json({
      sucesso: false,
      erro: `${config.name} é uma RÉPLICA, não pode escrever`,
      instancia: config.name
    });
  }

  const idx = database.produtos.findIndex(p => p._id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado' });
  }

  database.produtos.splice(idx, 1);
  
  res.json({
    sucesso: true,
    instancia: config.name
  });
});

// ========================================
// ROTA DE STATUS
// ========================================

app.get('/api/status', (req, res) => {
  const status = rpcClient.getStatus();
  
  res.json({
    instancia: config.name,
    porta: config.port,
    serviceId: config.serviceId,
    ehLider: rpcClient.isLeader || false,
    conectadoAoOrquestrador: status.isConnected,
    totalProdutos: database.produtos.length,
    endpointsRegistrados: status.endpoints,
    servicosDescobertos: status.discoveredServices,
    reqPendentes: status.pendingRequests
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(config.port, () => {
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n🚀 ${config.name} rodando em http://localhost:${config.port}\n`);
  console.log(`📋 ROTAS:`);
  console.log(`   GET  /api/produtos                (qualquer uma)`);
  console.log(`   GET  /api/produtos/:id            (qualquer uma)`);
  console.log(`   POST /api/produtos                (APENAS LÍDER)`);
  console.log(`   PUT  /api/produtos/:id            (APENAS LÍDER)`);
  console.log(`   DELETE /api/produtos/:id          (APENAS LÍDER)`);
  console.log(`   GET  /api/status                  (info da instância)`);
  console.log(`\n${config.name} STATUS:`);
  console.log(`   ID para Eleição: ${config.serviceId}`);
  console.log(`   Porção para conectar: http://localhost:${config.port}`);
  console.log(`\n${'═'.repeat(60)}\n`);
});

// ========================================
// TRATAMENTO DE SINAIS
// ========================================

process.on('SIGINT', () => {
  console.log(`\n\n👋 ${config.name} desligando...`);
  rpcClient.disconnect();
  process.exit(0);
});

module.exports = { app, rpcClient };
