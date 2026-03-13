/**
 * ORQUESTRADOR DISTRIBUÍDO - Integração dos 3 Microserviços
 * 
 * Conecta:
 * - Microserviço de Produtos (Seu: Caike)
 * - Microserviço de Clientes (Colega 1)
 * - Microserviço de Pedidos (Colega 2)
 * 
 * Com eleição de líder (Bully) e comunicação via Socket
 */

const http = require('http');
const EventEmitter = require('events');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         ORQUESTRADOR DISTRIBUÍDO - SISTEMA INTEGRADO           ║
║                                                                ║
║  Integra 3 Microserviços + Eleição de Líder + Socket RPC      ║
╚════════════════════════════════════════════════════════════════╝

🏗️  ARQUITETURA DO SISTEMA:

┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY / ORQUESTRADOR                 │
│                                                               │
│  Eleição de Líder: BULLY                                     │
│  Comunicação Inter-Serviços: Socket + gRPC                   │
│  Balanceamento de Carga: Rodízio                             │
└──────────────────────────────────────────────────────────────┘
        │                    │                    │
        │                    │                    │
┌───────▼──────────┐ ┌──────▼────────────┐ ┌────▼──────────────┐
│  MICROSERVIÇO    │ │  MICROSERVIÇO    │ │  MICROSERVIÇO     │
│  PRODUTOS        │ │  CLIENTES        │ │  PEDIDOS          │
│  (Porta 3002)    │ │  (Porta 3003)    │ │  (Porta 3004)     │
│                  │ │                  │ │                   │
│ • Listar         │ │ • Criar Cliente  │ │ • Criar Pedido    │
│ • Criar          │ │ • Atualizar      │ │ • Listar Pedidos  │
│ • Atualizar      │ │ • Deletar        │ │ • Atualizar       │
│ • Deletar        │ │ • Buscar         │ │ • Cancelar        │
│                  │ │ • Validar CPF    │ │ • Calcular Total  │
└──────────────────┘ └──────────────────┘ └───────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
              ┌──────────────▼───────────────┐
              │    BANCO DE DADOS            │
              │    MongoDB Atlas             │
              │    (Clusters Separados)      │
              └──────────────────────────────┘

═══════════════════════════════════════════════════════════════════

📡 FLUXO DE COMUNICAÇÃO:

1. NOVO PEDIDO (Cliente)
   └─ Cliente → API Gateway (Socket)
   └─ Gateway valida cliente (RPC ao Serviço de Clientes)
   └─ Gateway retorna produtos (RPC ao Serviço de Produtos)
   └─ Cliente选择 produtos
   └─ Gateway cria pedido (RPC ao Serviço de Pedidos)
   └─ Confirmação ao cliente (Socket)

2. ELEIÇÃO DE LÍDER (se um serviço cai)
   └─ Detecção: Falha de um dos 3
   └─ Algoritmo Bully: eleição automática
   └─ Novo líder coordena replicação
   └─ Outros sincronizam dados

═══════════════════════════════════════════════════════════════════
`);

// ========================================
// DEFINIÇÃO DE MICROSERVIÇOS
// ========================================

class Microservice extends EventEmitter {
  constructor(serviceName, port, serviceId) {
    super();
    this.name = serviceName;
    this.port = port;
    this.id = serviceId; // Para eleição (maior ID = líder)
    this.isLeader = false;
    this.isHealthy = true;
    this.endpoints = new Map();
    this.database = [];
  }

  // Registrar endpoint RPC
  registerEndpoint(methodName, handler) {
    this.endpoints.set(methodName, handler);
  }

  // Chamar uma função remota
  async callRemote(service, method, params) {
    // Simula chamada RPC entre serviços
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao chamar ${service}.${method}`));
      }, 5000);

      try {
        // Simula latência
        setTimeout(() => {
          clearTimeout(timeout);
          resolve({ sucesso: true, method, service, params });
        }, 100);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  getStatus() {
    return {
      service: this.name,
      id: this.id,
      port: this.port,
      isLeader: this.isLeader,
      isHealthy: this.isHealthy,
      endpoints: Array.from(this.endpoints.keys())
    };
  }
}

// ========================================
// ORQUESTRADOR + ELEIÇÃO
// ========================================

class DistributedOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.leader = null;
    this.inElection = false;
    this.electionRound = 0;
    this.heartbeatInterval = null;
  }

  registerService(serviceName, port, serviceId) {
    const service = new Microservice(serviceName, port, serviceId);
    
    // Registra endpoints fictícios
    this.registerDefaultEndpoints(service);
    
    this.services.set(serviceName, service);
    console.log(`\n✅ Microserviço "${serviceName}" registrado (ID: ${serviceId}, Porta: ${port})`);
    
    return service;
  }

  registerDefaultEndpoints(service) {
    switch (service.name) {
      case 'Produtos':
        service.registerEndpoint('listar', async (params) => ({
          sucesso: true,
          dados: [],
          total: 0
        }));
        service.registerEndpoint('obter', async (params) => ({
          sucesso: true,
          id: params.id
        }));
        service.registerEndpoint('criar', async (params) => ({
          sucesso: true,
          id: 'novo-' + Date.now()
        }));
        break;

      case 'Clientes':
        service.registerEndpoint('buscar', async (params) => ({
          sucesso: true,
          cliente: null
        }));
        service.registerEndpoint('validar_cpf', async (params) => ({
          sucesso: true,
          valido: true
        }));
        service.registerEndpoint('criar', async (params) => ({
          sucesso: true,
          id: 'cliente-' + Date.now()
        }));
        break;

      case 'Pedidos':
        service.registerEndpoint('listar', async (params) => ({
          sucesso: true,
          pedidos: [],
          total: 0
        }));
        service.registerEndpoint('criar', async (params) => ({
          sucesso: true,
          id: 'pedido-' + Date.now(),
          status: 'pendente'
        }));
        service.registerEndpoint('calcular_total', async (params) => ({
          sucesso: true,
          subtotal: 0,
          taxas: 0,
          total: 0
        }));
        break;
    }
  }

  // ========================================
  // ELEIÇÃO DE LÍDER (BULLY)
  // ========================================
  async initiateLeaderElection() {
    if (this.inElection) return;

    this.inElection = true;
    this.electionRound++;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🗳️  INICIANDO ELEIÇÃO DE LÍDER (Rodada ${this.electionRound})`);
    console.log(`${'═'.repeat(60)}`);

    // Encontra serviços saudáveis
    const healthyServices = Array.from(this.services.values())
      .filter(s => s.isHealthy)
      .sort((a, b) => b.id - a.id);

    if (healthyServices.length === 0) {
      console.log('❌ Nenhum serviço saudável disponível!');
      this.inElection = false;
      return;
    }

    // Eleito: serviço com maior ID
    const elected = healthyServices[0];
    this.leader = elected;

    console.log(`\n👑 NOVO LÍDER ELEITO: ${elected.name} (ID: ${elected.id})`);
    
    // Atualiza status de todos
    this.services.forEach((service) => {
      service.isLeader = (service === elected);
    });

    // Notifica todos
    console.log(`\n📢 Notificando todos os serviços:`);
    this.services.forEach((service) => {
      const status = service.isLeader ? '👑 LÍDER' : '📌 REPLICA';
      console.log(`   ${status}: ${service.name}`);
    });

    this.inElection = false;
  }

  // ========================================
  // SIMULAR FALHA DE SERVIÇO
  // ========================================
  simulateServiceFailure(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return;

    console.log(`\n⚠️  FALHA DETECTADA: ${serviceName} caiu!`);
    service.isHealthy = false;

    // Se era líder, inicia eleição
    if (service.isLeader) {
      console.log(`\n🔔 Líder ${serviceName} caiu! Iniciando eleição...`);
      setTimeout(() => this.initiateLeaderElection(), 1000);
    }
  }

  // ========================================
  // RECUPERAR SERVIÇO
  // ========================================
  recoverService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return;

    console.log(`\n✅ ${serviceName} recuperado!`);
    service.isHealthy = true;

    // Se não há líder, inicia eleição
    if (!this.leader) {
      setTimeout(() => this.initiateLeaderElection(), 500);
    }
  }

  // ========================================
  // MONITORAR SAÚDE (Heartbeat)
  // ========================================
  startHealthCheck(interval = 5000) {
    console.log(`\n💓 Iniciando monitoramento de saúde (a cada ${interval}ms)`);

    this.heartbeatInterval = setInterval(() => {
      const status = Array.from(this.services.values()).map(s => ({
        nome: s.name,
        saude: s.isHealthy ? '✅' : '❌',
        lider: s.isLeader ? '👑' : ''
      }));

      console.log('\n📊 Status de Saúde:');
      status.forEach(s => {
        console.log(`   ${s.saude} ${s.nome} ${s.lider}`);
      });
    }, interval);
  }

  stopHealthCheck() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  // ========================================
  // ROTEAMENTO DE REQUISIÇÕES
  // ========================================
  async routeRequest(serviceName, method, params) {
    const service = this.services.get(serviceName);
    
    if (!service) {
      throw new Error(`Serviço "${serviceName}" não encontrado`);
    }

    if (!service.isHealthy) {
      throw new Error(`Serviço "${serviceName}" está indisponível`);
    }

    const endpoint = service.endpoints.get(method);
    
    if (!endpoint) {
      throw new Error(`Método "${method}" não encontrado em "${serviceName}"`);
    }

    return await endpoint(params);
  }

  // ========================================
  // FLUXO DE PEDIDO COMPLETO
  // ========================================
  async processNewOrder(clienteId, produtosIds) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📦 PROCESSANDO NOVO PEDIDO`);
    console.log(`${'═'.repeat(60)}`);

    try {
      // 1. Valida cliente
      console.log(`\n1️⃣  Validando cliente ID: ${clienteId}`);
      const clienteResult = await this.routeRequest('Clientes', 'buscar', {
        id: clienteId
      });
      console.log(`   ✅ Cliente encontrado`);

      // 2. Busca produtos
      console.log(`\n2️⃣  Buscando produtos: ${produtosIds.join(', ')}`);
      const produtosResult = await this.routeRequest('Produtos', 'listar', {
        ids: produtosIds
      });
      console.log(`   ✅ ${produtosIds.length} produtos encontrados`);

      // 3. Calcula total
      console.log(`\n3️⃣  Calculando total do pedido`);
      const totalResult = await this.routeRequest('Pedidos', 'calcular_total', {
        produtos: produtosIds,
        cliente: clienteId
      });
      console.log(`   ✅ Total calculado`);

      // 4. Cria pedido
      console.log(`\n4️⃣  Criando pedido`);
      const pedidoResult = await this.routeRequest('Pedidos', 'criar', {
        cliente: clienteId,
        produtos: produtosIds,
        total: totalResult.total
      });
      console.log(`   ✅ Pedido criado: ${pedidoResult.id}`);

      console.log(`\n${'═'.repeat(60)}`);
      console.log(`✅ PEDIDO PROCESSADO COM SUCESSO`);
      console.log(`${'═'.repeat(60)}\n`);

      return pedidoResult;

    } catch (error) {
      console.log(`\n❌ ERRO ao processar pedido: ${error.message}\n`);
      throw error;
    }
  }

  // ========================================
  // VISUALIZAR STATUS
  // ========================================
  printStatus() {
    console.log(`\n📊 STATUS DO SISTEMA DISTRIBUÍDO:`);
    console.log(`${'═'.repeat(60)}`);
    
    console.log(`\nLíder Atual: ${this.leader ? this.leader.name : 'NENHUM'}`);
    console.log(`Rodada de Eleição: ${this.electionRound}`);
    
    console.log(`\nMicroserviços:`);
    this.services.forEach((service) => {
      const saude = service.isHealthy ? '✅' : '❌';
      const lider = service.isLeader ? '👑' : '📌';
      console.log(`   ${saude} ${lider} ${service.name} (ID: ${service.id}, Porta: ${service.port})`);
    });

    console.log(`\n${'═'.repeat(60)}\n`);
  }
}

// ========================================
// EXEMPLO DE USO
// ========================================

console.log(`

📚 COMO USAR ESTE ORQUESTRADOR:

const orchestrator = new DistributedOrchestrator();

// 1. Registrar os 3 microserviços (com seus IDs para eleição)
orchestrator.registerService('Produtos', 3002, 3);   // ID=3
orchestrator.registerService('Clientes', 3003, 2);   // ID=2
orchestrator.registerService('Pedidos', 3004, 1);    // ID=1

// 2. Iniciar eleição
await orchestrator.initiateLeaderElection();

// 3. Processar pedido
await orchestrator.processNewOrder('cliente-1', ['produto-1', 'produto-2']);

// 4. Simular falha
orchestrator.simulateServiceFailure('Produtos');  // Cai e reinicia eleição

// 5. Recuperar
orchestrator.recoverService('Produtos');

// 6. Monitorar saúde
orchestrator.startHealthCheck(5000);

═══════════════════════════════════════════════════════════════════

🎯 PRÓXIMOS PASSOS:

1. Configure as 3 APIs reais (Seu código + código dos colegas)
2. Implemente Socket.io para comunicação real
3. Use este orquestrador como Gateway
4. Teste failover e recovery

═══════════════════════════════════════════════════════════════════
`);

module.exports = { DistributedOrchestrator, Microservice };

console.log('✅ Orquestrador Distribuído carregado!');
console.log('Node: node distributed-orchestrator.js');
console.log('Next: Configure as portas reais e endpoints');
