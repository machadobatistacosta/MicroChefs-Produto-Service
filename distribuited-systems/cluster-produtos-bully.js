#!/usr/bin/env node

/**
 * CLUSTER PRODUTOS COM BULLY ALGORITHM (DESCENTRALIZADO)
 * 
 * 3 Instâncias totalmente autônomas que se elegem entre si
 * ❌ SEM ORQUESTRADOR CENTRAL
 * ✅ TOTALMENTE DISTRIBUÍDO
 * 
 * Cada nó:
 * - Conhece os outros nós
 * - Se conecta aos outros nós
 * - Participa de eleição Bully
 * - Detecta falhas de outros nós
 * - Inicia eleição se líder cai
 */

const express = require('express');
const http = require('http');
const { Server: IOServer } = require('socket.io');
const { EventEmitter } = require('events');

console.log(`
╔════════════════════════════════════════════════════════════╗
║   CLUSTER PRODUTOS - BULLY ALGORITHM (DESCENTRALIZADO)     ║
║                                                            ║
║  3 Instâncias que se elegem entre si                       ║
║  ├─ Produtos-1 (3002) - ID=3                              ║
║  ├─ Produtos-2 (3003) - ID=2                              ║
║  └─ Produtos-3 (3004) - ID=1                              ║
║                                                            ║
║  ✅ SEM ORQUESTRADOR CENTRAL                              ║
║  ✅ TOTALMENTE DISTRIBUÍDO                                ║
║  ✅ FAILOVER AUTOMÁTICO                                   ║
╚════════════════════════════════════════════════════════════╝
`);

// ========================================
// CONFIGURAÇÃO POR INSTÂNCIA
// ========================================

const INSTANCIA = process.env.INSTANCIA || '1';

const CONFIGS = {
  '1': {
    port: 3002,
    serviceId: 3,
    name: 'Produtos-1',
    othersConfig: [
      { host: 'localhost', port: 3003, serviceId: 2 },
      { host: 'localhost', port: 3004, serviceId: 1 }
    ]
  },
  '2': {
    port: 3003,
    serviceId: 2,
    name: 'Produtos-2',
    othersConfig: [
      { host: 'localhost', port: 3002, serviceId: 3 },
      { host: 'localhost', port: 3004, serviceId: 1 }
    ]
  },
  '3': {
    port: 3004,
    serviceId: 1,
    name: 'Produtos-3',
    othersConfig: [
      { host: 'localhost', port: 3002, serviceId: 3 },
      { host: 'localhost', port: 3003, serviceId: 2 }
    ]
  }
};

const config = CONFIGS[INSTANCIA];

console.log(`\n🚀 Iniciando ${config.name} (Porta ${config.port}, ID=${config.serviceId})\n`);

// ========================================
// BANCO DE DADOS (simulado, compartilhado em memória)
// ========================================

const database = {
  produtos: [
    { _id: '1', nome: 'Sushi', preco: 45.90, estoque: 100 },
    { _id: '2', nome: 'X-Burger', preco: 32.50, estoque: 50 },
    { _id: '3', nome: 'Coca Cola', preco: 5.00, estoque: 200 }
  ]
};

// ========================================
// IMPLEMENTAÇÃO BULLY ALGORITHM
// ========================================

class BullyElectionNode extends EventEmitter {
  constructor(nodeId, allNodeIds, config) {
    super();
    
    this.nodeId = nodeId;
    this.allNodeIds = allNodeIds;
    this.config = config;
    
    this.isCoordinator = false;
    this.inElection = false;
    this.receivedOkResponses = [];
    this.otherNodes = new Map(); // Sockets dos outros nós
    this.electionTimeout = null;
    
    // ✅ Heartbeat para detectar morte do LÍDER
    this.lastCoordinatorHeartbeat = Date.now();
    this.coordinatorId = null;
    this.heartbeatCheckInterval = null;
    this.heartbeatTimeout = 5000; // 5 segundos sem resposta = morto
    
    // ✅ FIX CRÍTICA: Epoch/Versão para evitar múltiplos LÍDEREs
    this.currentEpoch = 0;        // Versão de MINHA eleição atual
    this.coordinatorEpoch = 0;    // Versão do LÍDER que conheço
    
    // ✅ NEW: Sincronário de startup - rastrear quais nós estão READY
    this.readyNodes = new Set([nodeId]); // Começa com ele próprio
    this.electionCanStart = false;
    
    console.log(`   🎯 BullyNode criado com ID=${this.nodeId}`);
    console.log(`   🔗 Outros nós conhecidos: ${this.allNodeIds.filter(id => id !== this.nodeId).join(', ')}`);
  }

  /**
   * Conectar a todos os outros nós
   */
  async connectToOtherNodes(ioServer) {
    console.log(`\n   🔌 Conectando aos outros nós...`);
    
    for (const otherConfig of this.config.othersConfig) {
      try {
        const socket = require('socket.io-client')(`http://${otherConfig.host}:${otherConfig.port}`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
          console.log(`   ✅ Conectado a nó em ${otherConfig.host}:${otherConfig.port}`);
        });

        socket.on('ready_message', (data) => {
          console.log(`   🤝 [${this.config.name}] Recebeu READY de ${data.fromName} (ID=${data.fromId})`);
          this.readyNodes.add(data.fromId);
        });

        socket.on('election_message', (data) => {
          this.handleElectionMessage(data);
        });

        socket.on('ok_message', (data) => {
          this.handleOkMessage(data);
        });

        socket.on('coordinator_message', (data) => {
          this.handleCoordinatorMessage(data);
        });

        socket.on('heartbeat', (data) => {
          this.lastCoordinatorHeartbeat = Date.now();
        });

        socket.on('disconnect', () => {
          console.log(`   ❌ Desconectado de ${otherConfig.host}:${otherConfig.port}`);
        });

        this.otherNodes.set(otherConfig.serviceId, socket);
      } catch (erro) {
        console.log(`   ⚠️  Erro ao conectar a ${otherConfig.host}:${otherConfig.port}: ${erro.message}`);
      }
    }

    // Aguardar um pouco para conexões estabilizarem
    await new Promise(r => setTimeout(r, 3000));  // ← AUMENTADO de 1500 para 3000ms
  }

  /**
   * ✅ NEW: Sincronizar startup com Ready Handshake
   * Todos os nós precisam estar prontos antes de iniciar eleição
   */
  async waitForAllNodesToBeReady() {
    console.log(`\n   🤝 Iniciando Ready Handshake...`);
    
    // Enviar "i-am-ready" para todos os outros nós
    for (const socket of this.otherNodes.values()) {
      if (socket && socket.connected) {
        socket.emit('ready_message', {
          fromId: this.nodeId,
          fromName: this.config.name,
          timestamp: Date.now()
        });
      }
    }
    
    // Aguardar que todos os nós sinalizem READY
    const maxWaitTime = 30000; // 30 segundos máximo (dá tempo para P3 iniciar com 4s de delay)
    const startTime = Date.now();
    
    while (this.readyNodes.size < this.allNodeIds.length) {
      if (Date.now() - startTime > maxWaitTime) {
        console.log(`   ⚠️  Timeout aguardando todos nós ficarem READY`);
        console.log(`   📊 Ready nodes: ${Array.from(this.readyNodes).sort().join(', ')} / ${this.allNodeIds.join(', ')}`);
        break;
      }
      
      // Mostrar progresso
      if (this.readyNodes.size !== this.allNodeIds.length) {
        console.log(`   ⏳ Aguardando... ${this.readyNodes.size}/${this.allNodeIds.length} nodes prontos`);
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`   ✅ TODOS OS NODES PRONTOS! = ${Array.from(this.readyNodes).sort().join(', ')}`);
    this.electionCanStart = true;
  }
  /**
   * ✅ NEW: Iniciar heartbeat monitor
   */
  startHeartbeatMonitor() {
    if (this.heartbeatCheckInterval) clearInterval(this.heartbeatCheckInterval);
    
    this.heartbeatCheckInterval = setInterval(() => {
      // Se não sou LÍDER, verifico se LÍDER está vivo
      if (!this.isCoordinator && this.coordinatorId !== null) {
        const timeSinceLastHeartbeat = Date.now() - this.lastCoordinatorHeartbeat;
        
        if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
          console.log(`\n   ❌ [${this.config.name}] LÍDER (ID=${this.coordinatorId}) NÃO RESPONDE!`);
          console.log(`   🗳️  Iniciando eleição automática...`);
          this.initiateElection();
        }
      } else if (this.isCoordinator) {
        // Se sou LÍDER, envio heartbeat para manter vivo
        this.sendHeartbeat();
      }
    }, 2000); // Verificar a cada 2 segundos
  }

  /**
   * ✅ NEW: Enviar heartbeat do LÍDER
   */
  sendHeartbeat() {
    for (const socket of this.otherNodes.values()) {
      if (socket && socket.connected) {
        socket.emit('heartbeat', {
          fromId: this.nodeId,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Configurar servidor Socket.io para receber mensagens
   */
  setupIOServer(ioServer) {
    ioServer.on('connection', (socket) => {
      console.log(`   🔌 Novo nó conectado ao servidor`);

      socket.on('ready_message', (data) => {
        console.log(`   🤝 [${this.config.name}] Recebeu READY de ${data.fromName} (ID=${data.fromId})`);
        this.readyNodes.add(data.fromId);
      });

      socket.on('election_message', (data) => {
        this.handleElectionMessage(data);
      });

      socket.on('ok_message', (data) => {
        this.handleOkMessage(data);
      });

      socket.on('coordinator_message', (data) => {
        this.handleCoordinatorMessage(data);
      });

      socket.on('heartbeat', (data) => {
        this.lastCoordinatorHeartbeat = Date.now();
      });
    });
  }

  /**
   * Iniciar eleição
   */
  initiateElection() {
    if (this.inElection) {
      console.log(`   ⚠️  Eleição já em progresso (epoch=${this.currentEpoch})`);
      return;
    }
    
    // ✅ FIX: Se já tenho um LÍDER válido, não iniciar eleição
    if (this.coordinatorId !== null && this.coordinatorEpoch >= this.currentEpoch) {
      console.log(`   ⏭️  Já tenho LÍDER válido (ID=${this.coordinatorId}, epoch=${this.coordinatorEpoch}), não initio eleição`);
      return;
    }

    // ✅ FIX: Incrementar epoch a cada eleição
    this.currentEpoch++;
    
    console.log(`\n   🗳️  [${this.config.name}] INICIANDO ELEIÇÃO (epoch=${this.currentEpoch})`);
    this.inElection = true;
    this.receivedOkResponses = [];

    const higherNodes = this.allNodeIds.filter(id => id > this.nodeId);

    if (higherNodes.length === 0) {
      console.log(`   👑 [${this.config.name}] NENHUM NÓ COM ID MAIOR!`);
      // ✅ FIX: Esperar MAIS TEMPO (2s) para lidar com startups com delays
      // Isso previne que nós com ID baixo se elegem LÍDER quando nós com ID alto estão ainda iniciando
      setTimeout(() => {
        // Se ainda ninguém respondeu, me elejo
        if (this.receivedOkResponses.length === 0 && !this.inElection) {
          console.log(`   ✅ [${this.config.name}] Confirmado: nenhum OK recebido, me elegendo...`);
          this.becomeCoordinator();
        }
      }, 2000);  // ← AUMENTADO de 1000 para 2000ms
      return;
    }

    console.log(`   📤 [${this.config.name}] Enviando ELECTION (epoch=${this.currentEpoch}) para nós: ${higherNodes.join(', ')}`);
    
    // Enviar ELECTION para nós com ID maior
    for (const higherNodeId of higherNodes) {
      const socket = this.otherNodes.get(higherNodeId);
      if (socket && socket.connected) {
        socket.emit('election_message', {
          fromId: this.nodeId,
          fromName: this.config.name,
          epoch: this.currentEpoch,  // ✅ Enviar epoch
          timestamp: Date.now()
        });
      }
    }

    // Timeout para eleição (6 segundos - precisa dar tempo para conexões Socket.io estabilizarem)
    if (this.electionTimeout) clearTimeout(this.electionTimeout);
    
    this.electionTimeout = setTimeout(() => {
      if (this.receivedOkResponses.length === 0) {
        console.log(`   ✅ [${this.config.name}] NENHUMA RESPOSTA RECEBIDA (epoch=${this.currentEpoch})`);
        this.becomeCoordinator();
      } else {
        console.log(`   ⏳ [${this.config.name}] Aguardando coordenador ser eleito... (epoch=${this.currentEpoch})`);
      }
      this.inElection = false;
    }, 6000);
  }

  /**
   * Lidar com mensagem ELECTION
   */
  handleElectionMessage(data) {
    console.log(`   📨 [${this.config.name}] Recebeu ELECTION de ${data.fromName} (ID=${data.fromId}, epoch=${data.epoch})`);

    // Responder com OK
    const socket = this.otherNodes.get(data.fromId);
    if (socket && socket.connected) {
      console.log(`   📤 [${this.config.name}] Enviando OK para ID=${data.fromId} (epoch=${data.epoch})`);
      socket.emit('ok_message', {
        fromId: this.nodeId,
        fromName: this.config.name,
        epoch: data.epoch  // ✅ Passar epoch do candidato
      });
    }

    // Iniciar eleição própria se tem ID maior
    if (data.fromId < this.nodeId && !this.inElection) {
      console.log(`   🔄 [${this.config.name}] Iniciando eleição própria (ID ${this.nodeId} > ${data.fromId})`);
      this.initiateElection();
    }
  }

  /**
   * Lidar com mensagem OK
   */
  handleOkMessage(data) {
    console.log(`   ✋ [${this.config.name}] Recebeu OK de ID=${data.fromId} para epoch=${data.epoch}`);
    if (!this.receivedOkResponses.includes(data.fromId)) {
      this.receivedOkResponses.push(data.fromId);
    }
  }

  /**
   * Lidar com mensagem COORDINATOR
   */
  handleCoordinatorMessage(data) {
    console.log(`   👑 [${this.config.name}] NOVO COORDENADOR: ${data.fromName} (ID=${data.fromId}, epoch=${data.epoch})`);
    
    // ✅ FIX CRÍTICA: Validar epoch ANTES de aceitar novo LÍDER
    
    // Se epoch do novo coordenador é MENOR do que o que conheço, rejeitar
    if (data.epoch < this.coordinatorEpoch) {
      console.log(`   ⚠️  [${this.config.name}] REJEITADO! epoch ${data.epoch} < atual ${this.coordinatorEpoch}`);
      return;
    }
    
    // Se epoch é IGUAL, validar que ID é maior
    if (data.epoch === this.coordinatorEpoch && data.fromId < this.coordinatorId) {
      console.log(`   ⚠️  [${this.config.name}] REJEITADO! epoch=${data.epoch} igual, mas ID ${data.fromId} < ${this.coordinatorId}`);
      return;
    }
    
    // ✅ ACEITAR novo coordenador
    console.log(`   ✅ [${this.config.name}] ACEITANDO novo LÍDER (epoch=${data.epoch})`);
    this.coordinatorEpoch = data.epoch;  // Atualizar versão
    this.coordinatorId = data.fromId;
    this.isCoordinator = (data.fromId === this.nodeId);
    this.inElection = false;
    this.lastCoordinatorHeartbeat = Date.now();
    
    if (this.isCoordinator) {
      console.log(`   ✅ [${this.config.name}] EU SOU O NOVO LÍDER (epoch=${this.coordinatorEpoch})`);
      this.emit('became-leader');
    } else {
      console.log(`   📌 [${this.config.name}] Sou réplica. Líder é ID=${data.fromId} (epoch=${data.epoch})`);
      this.emit('became-replica', data.fromId);
    }
  }

  /**
   * Tornar-se coordenador
   */
  becomeCoordinator() {
    // ✅ FIX: Quando me elejo LÍDER, actualizo epoch
    this.coordinatorEpoch = this.currentEpoch;
    
    console.log(`\n   👑 [${this.config.name}] ELEITO COMO NOVO COORDENADOR (epoch=${this.coordinatorEpoch})`);
    this.isCoordinator = true;
    this.coordinatorId = this.nodeId;
    this.inElection = false;

    // ✅ FIX: Aguardar um pouco para sockets estarem prontos antes de notificar
    setTimeout(() => {
      // Notificar todos os outros nós
      console.log(`   📢 [${this.config.name}] Notificando outros nós sobre nova liderança (epoch=${this.coordinatorEpoch})...`);
      
      for (const socket of this.otherNodes.values()) {
        if (socket && socket.connected) {
          socket.emit('coordinator_message', {
            fromId: this.nodeId,
            fromName: this.config.name,
            epoch: this.coordinatorEpoch,  // ✅ Enviar epoch
            timestamp: Date.now()
          });
        }
      }
    }, 500);  // 500ms delay para sockets estabilizarem

    this.emit('became-leader');
  }
}

// ========================================
// EXPRESS APP
// ========================================

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: '*' }
});

app.use(express.json());

// ========================================
// INICIALIZAR BULLY NODE
// ========================================

const allNodeIds = [3, 2, 1]; // IDs de todos os nós
const bullyNode = new BullyElectionNode(config.serviceId, allNodeIds, config);

bullyNode.on('became-leader', () => {
  console.log(`\n🎯 ${config.name} é agora LÍDER`);
});

bullyNode.on('became-replica', (leaderId) => {
  console.log(`\n🎯 ${config.name} é agora RÉPLICA (Líder: ID=${leaderId})`);
});

// ========================================
// HANDLER DE ELEIÇÃO
// ========================================

/**
 * Detectar falha do coordenador a cada 5 segundos
 */
setInterval(() => {
  // Se ninguém está em eleição e não sou coordenador, talvez ele caiu
  if (!bullyNode.inElection && !bullyNode.isCoordinator) {
    // Opcionalmente, iniciar eleição para verificar
    // bullyNode.initiateElection();
  }
}, 5000);

// ========================================
// ROTAS API
// ========================================

/**
 * GET /api/produtos - Listar todos os produtos
 */
app.get('/api/produtos', (req, res) => {
  res.json({
    sucesso: true,
    produtos: database.produtos,
    instancia: config.name,
    ehLider: bullyNode.isCoordinator,
    mensagem: 'Qualquer nó pode ler'
  });
});

/**
 * GET /api/produtos/:id - Obter produto específico
 */
app.get('/api/produtos/:id', (req, res) => {
  const produto = database.produtos.find(p => p._id === req.params.id);
  
  if (!produto) {
    return res.status(404).json({
      sucesso: false,
      erro: 'Produto não encontrado'
    });
  }

  res.json({
    sucesso: true,
    produto: produto,
    instancia: config.name
  });
});

/**
 * POST /api/produtos - Criar novo produto
 */
app.post('/api/produtos', (req, res) => {
  // Apenas LÍDER pode criar
  if (!bullyNode.isCoordinator) {
    return res.status(503).json({
      sucesso: false,
      erro: `${config.name} é uma RÉPLICA, não pode escrever`,
      mensagem: 'Envie a requisição para o LÍDER',
      instancia: config.name
    });
  }

  const { nome, preco, estoque } = req.body;

  if (!nome || !preco || estoque === undefined) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Campos obrigatórios: nome, preco, estoque'
    });
  }

  const novoProduto = {
    _id: Date.now().toString(),
    nome,
    preco: parseFloat(preco),
    estoque: parseInt(estoque)
  };

  database.produtos.push(novoProduto);

  res.status(201).json({
    sucesso: true,
    produto: novoProduto,
    instancia: config.name,
    mensagem: `Criado pelo LÍDER ${config.name}`
  });
});

/**
 * PUT /api/produtos/:id - Atualizar produto
 */
app.put('/api/produtos/:id', (req, res) => {
  // Apenas LÍDER pode atualizar
  if (!bullyNode.isCoordinator) {
    return res.status(503).json({
      sucesso: false,
      erro: `${config.name} é uma RÉPLICA, não pode escrever`,
      instancia: config.name
    });
  }

  const produto = database.produtos.find(p => p._id === req.params.id);

  if (!produto) {
    return res.status(404).json({
      sucesso: false,
      erro: 'Produto não encontrado'
    });
  }

  if (req.body.nome) produto.nome = req.body.nome;
  if (req.body.preco) produto.preco = parseFloat(req.body.preco);
  if (req.body.estoque !== undefined) produto.estoque = parseInt(req.body.estoque);

  res.json({
    sucesso: true,
    produto: produto,
    instancia: config.name,
    mensagem: `Atualizado pelo LÍDER ${config.name}`
  });
});

/**
 * DELETE /api/produtos/:id - Deletar produto
 */
app.delete('/api/produtos/:id', (req, res) => {
  // Apenas LÍDER pode deletar
  if (!bullyNode.isCoordinator) {
    return res.status(503).json({
      sucesso: false,
      erro: `${config.name} é uma RÉPLICA, não pode escrever`,
      instancia: config.name
    });
  }

  const indice = database.produtos.findIndex(p => p._id === req.params.id);

  if (indice === -1) {
    return res.status(404).json({
      sucesso: false,
      erro: 'Produto não encontrado'
    });
  }

  const produtoDeletado = database.produtos.splice(indice, 1)[0];

  res.json({
    sucesso: true,
    produto: produtoDeletado,
    instancia: config.name,
    mensagem: `Deletado pelo LÍDER ${config.name}`
  });
});

/**
 * GET /api/status - Status da instância
 */
app.get('/api/status', (req, res) => {
  res.json({
    instancia: config.name,
    porta: config.port,
    serviceId: config.serviceId,
    ehLider: bullyNode.isCoordinator,
    conectadosAOutrosNos: bullyNode.otherNodes.size,
    totalProdutos: database.produtos.length,
    emEleitacao: bullyNode.inElection,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/eleicao - Forçar eleição (para testes)
 */
app.post('/api/eleicao', (req, res) => {
  console.log(`\n🗳️  ${config.name} foi forçado a iniciar eleição`);
  bullyNode.initiateElection();

  res.json({
    sucesso: true,
    mensagem: `${config.name} iniciou eleição`,
    instancia: config.name
  });
});

// ========================================
// INICIALIZAR SERVIDOR
// ========================================

bullyNode.setupIOServer(io);

// ✅ NEW: Iniciar heartbeat monitor
bullyNode.startHeartbeatMonitor();

server.listen(config.port, async () => {
  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`✅ ${config.name} rodando em http://localhost:${config.port}`);
  console.log(`════════════════════════════════════════════════════════════`);
  console.log(`\n📋 ROTAS:`);
  console.log(`   GET  /api/produtos              (qualquer nó)`);
  console.log(`   GET  /api/produtos/:id          (qualquer nó)`);
  console.log(`   POST /api/produtos              (APENAS LÍDER)`);
  console.log(`   PUT  /api/produtos/:id          (APENAS LÍDER)`);
  console.log(`   DELETE /api/produtos/:id        (APENAS LÍDER)`);
  console.log(`   GET  /api/status                (info da instância)`);
  console.log(`   POST /api/eleicao               (forçar eleição)`);
  console.log(`\n════════════════════════════════════════════════════════════\n`);

  // Conectar a outros nós
  await bullyNode.connectToOtherNodes(io);

  // ✅ NEW: Sincronizar com outros nós antes de iniciar eleição
  await bullyNode.waitForAllNodesToBeReady();

  // Aguardar um pouco mais e iniciar eleição (agora que todos estão prontos)
  console.log(`\n   🎯 Iniciando eleição inicial...`);
  bullyNode.initiateElection();
});

// ========================================
// TRATAMENTO DE ERRO
// ========================================

process.on('SIGINT', () => {
  console.log(`\n\n👋 ${config.name} desligando gracefully...\n`);
  server.close();
  process.exit(0);
});
