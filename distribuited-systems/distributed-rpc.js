/**
 * COMUNICAÇÃO DISTRIBUÍDA COM SOCKET.IO + RPC
 * 
 * Cada microserviço se conecta e pode chamar RPC um no outro
 * Suporta fallback automático quando um cai
 */

const io = require('socket.io-client');
const EventEmitter = require('events');

class DistributedRPCClient extends EventEmitter {
  constructor(serviceName, servicePort, serviceId) {
    super();
    this.serviceName = serviceName;
    this.servicePort = servicePort;
    this.serviceId = serviceId;
    
    this.socket = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    
    this.connectedServices = new Map();
    this.isConnected = false;
    
    // Simula endpoints locais
    this.localEndpoints = new Map();
  }

  // ========================================
  // CONECTAR AO SERVIDOR
  // ========================================
  connect(orchestratorUrl = 'http://localhost:9000') {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(orchestratorUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'] // Fallback
        });

        this.socket.on('connect', () => {
          console.log(`\n✅ [${this.serviceName}] Conectado ao Orquestrador`);
          this.isConnected = true;
          
          // Registra no orquestrador
          this.socket.emit('register_service', {
            name: this.serviceName,
            port: this.servicePort,
            id: this.serviceId,
            endpoints: Array.from(this.localEndpoints.keys())
          });

          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log(`\n⚠️  [${this.serviceName}] Desconectado: ${reason}`);
          this.isConnected = false;
          this.connectedServices.clear();
        });

        this.socket.on('service_registered', (data) => {
          console.log(`\n📌 [${this.serviceName}] Serviço registrado no orquestrador`);
        });

        // Recebe chamada RPC de outro serviço
        this.socket.on('rpc_call', (message) => {
          this.handleRPCCall(message);
        });

        // Recebe resposta RPC
        this.socket.on('rpc_response', (message) => {
          this.handleRPCResponse(message);
        });

        // Notificação de novo serviço conectado
        this.socket.on('service_discovered', (service) => {
          console.log(`\n🔍 [${this.serviceName}] Descobriu: ${service.name} (ID: ${service.id})`);
          this.connectedServices.set(service.name, service);
        });

        // Eleição de líder
        this.socket.on('leader_elected', (data) => {
          console.log(`\n👑 [${this.serviceName}] Novo líder: ${data.leader.name}`);
        });

        this.socket.on('connect_error', (error) => {
          console.log(`\n❌ [${this.serviceName}] Erro de conexão:`, error.message);
          reject(error);
        });

      } catch (error) {
        console.log(`\n❌ [${this.serviceName}] Erro ao conectar:`, error.message);
        reject(error);
      }
    });
  }

  // ========================================
  // REGISTRAR ENDPOINT LOCAL (RPC)
  // ========================================
  registerEndpoint(methodName, handler) {
    this.localEndpoints.set(methodName, handler);
    console.log(`\n📝 [${this.serviceName}] Endpoint registrado: ${methodName}`);
    
    return this;
  }

  // ========================================
  // CHAMAR RPC REMOTO
  // ========================================
  async callRemote(targetService, method, params = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Não conectado ao orquestrador'));
        return;
      }

      const requestId = ++this.requestId;

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Timeout na chamada RPC ${method}@${targetService}`));
      }, timeout);

      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeoutHandle);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        }
      });

      this.socket.emit('rpc_call', {
        requestId,
        from: this.serviceName,
        to: targetService,
        method,
        params,
        timestamp: Date.now()
      });

      console.log(`\n📤 [${this.serviceName}] RPC chamada: ${method}@${targetService}`);
    });
  }

  // ========================================
  // LIDAR COM CHAMADA RPC RECEBIDA
  // ========================================
  async handleRPCCall(message) {
    const { requestId, from, method, params } = message;

    console.log(`\n📥 [${this.serviceName}] RPC recebida: ${method} de ${from}`);

    try {
      const endpoint = this.localEndpoints.get(method);

      if (!endpoint) {
        throw new Error(`Método "${method}" não registrado`);
      }

      const result = await endpoint(params);

      this.socket.emit('rpc_response', {
        requestId,
        from: this.serviceName,
        to: from,
        result,
        success: true,
        timestamp: Date.now()
      });

      console.log(`\n✅ [${this.serviceName}] RPC respondida: ${method}`);

    } catch (error) {
      this.socket.emit('rpc_response', {
        requestId,
        from: this.serviceName,
        to: from,
        error: error.message,
        success: false,
        timestamp: Date.now()
      });

      console.log(`\n❌ [${this.serviceName}] Erro ao processar RPC: ${error.message}`);
    }
  }

  // ========================================
  // LIDAR COM RESPOSTA RPC
  // ========================================
  handleRPCResponse(message) {
    const { requestId, from, result, error, success } = message;

    const pending = this.pendingRequests.get(requestId);

    if (!pending) return;

    this.pendingRequests.delete(requestId);

    if (success) {
      console.log(`\n✅ [${this.serviceName}] Resposta de ${from}: sucesso`);
      pending.resolve(result);
    } else {
      console.log(`\n❌ [${this.serviceName}] Resposta de ${from}: ${error}`);
      pending.reject(new Error(error));
    }
  }

  // ========================================
  // BROADCAST (enviar para todos)
  // ========================================
  broadcast(event, data) {
    this.socket.emit('broadcast', {
      from: this.serviceName,
      event,
      data,
      timestamp: Date.now()
    });

    console.log(`\n📢 [${this.serviceName}] Broadcast enviado: ${event}`);
  }

  // ========================================
  // STATUS
  // ========================================
  getStatus() {
    return {
      service: this.serviceName,
      id: this.serviceId,
      port: this.servicePort,
      isConnected: this.isConnected,
      endpoints: Array.from(this.localEndpoints.keys()),
      discoveredServices: Array.from(this.connectedServices.keys()),
      pendingRequests: this.pendingRequests.size
    };
  }

  // ========================================
  // DISCONNECT
  // ========================================
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log(`\n👋 [${this.serviceName}] Desconectado`);
    }
  }
}

// ========================================
// SERVIDOR ORQUESTRADOR
// ========================================

const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

class RPCOrchestrator {
  constructor(port = 9000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: { origin: '*' }
    });

    this.services = new Map();
    this.electionRound = 0;

    this.setupIO();
  }

  setupIO() {
    this.io.on('connection', (socket) => {
      console.log(`\n🔌 Novo cliente conectado: ${socket.id}`);

      // Registrar serviço
      socket.on('register_service', (data) => {
        console.log(`\n✅ Serviço registrado: ${data.name} (ID: ${data.id})`);
        
        this.services.set(data.name, {
          ...data,
          socketId: socket.id,
          socket: socket,
          isHealthy: true,
          lastHeartbeat: Date.now()
        });

        // Notifica todos sobre o novo serviço
        this.io.emit('service_discovered', data);

        // Inicia eleição se é a primeira
        if (this.services.size === 1) {
          this.initiateLeaderElection();
        }

        socket.emit('service_registered', { success: true });
      });

      // Rotear RPC call
      socket.on('rpc_call', (message) => {
        console.log(`\n📤 RPC roteada: ${message.method}@${message.to}`);
        
        const targetService = this.services.get(message.to);
        if (targetService && targetService.isHealthy) {
          targetService.socket.emit('rpc_call', message);
        } else {
          console.log(`\n❌ Serviço ${message.to} não disponível`);
          socket.emit('rpc_response', {
            requestId: message.requestId,
            error: `Serviço ${message.to} não disponível`,
            success: false
          });
        }
      });

      // Rotear RPC response
      socket.on('rpc_response', (message) => {
        const targetService = this.services.get(message.to);
        if (targetService) {
          targetService.socket.emit('rpc_response', message);
        }
      });

      // Broadcast
      socket.on('broadcast', (message) => {
        console.log(`\n📢 Broadcast de ${message.from}: ${message.event}`);
        socket.broadcast.emit('broadcast', message);
      });

      // Heartbeat
      socket.on('heartbeat', (data) => {
        const service = Array.from(this.services.values())
          .find(s => s.socketId === socket.id);
        if (service) {
          service.lastHeartbeat = Date.now();
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`\n👋 Cliente desconectado: ${socket.id}`);
        
        const service = Array.from(this.services.values())
          .find(s => s.socketId === socket.id);
        
        if (service) {
          console.log(`\n❌ Serviço desconectado: ${service.name}`);
          this.services.delete(service.name);
          this.initiateLeaderElection();
        }
      });
    });
  }

  // ========================================
  // ELEIÇÃO
  // ========================================
  initiateLeaderElection() {
    this.electionRound++;
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🗳️  ELEIÇÃO DE LÍDER (Rodada ${this.electionRound})`);
    console.log(`${'═'.repeat(60)}`);

    const healthyServices = Array.from(this.services.values())
      .filter(s => s.isHealthy)
      .sort((a, b) => b.id - a.id);

    if (healthyServices.length === 0) {
      console.log('❌ Nenhum serviço saudável');
      return;
    }

    const leader = healthyServices[0];
    console.log(`\n👑 Novo líder: ${leader.name} (ID: ${leader.id})\n`);

    this.io.emit('leader_elected', { leader: leader });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`\n🚀 Orquestrador RPC rodando em porta ${this.port}`);
    });
  }

  getStatus() {
    return {
      services: Array.from(this.services.values()).map(s => ({
        name: s.name,
        id: s.id,
        port: s.port,
        isHealthy: s.isHealthy
      })),
      electionRound: this.electionRound
    };
  }
}

module.exports = { DistributedRPCClient, RPCOrchestrator };

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     COMUNICAÇÃO RPC DISTRIBUÍDA COM SOCKET.IO + Fallback       ║
╚════════════════════════════════════════════════════════════════╝

📝 EXEMPLO DE USO:

// SERVER (Rode isso primeiro)
const { RPCOrchestrator } = require('./distributed-rpc');
const orchestrator = new RPCOrchestrator(9000);
orchestrator.start();

// CLIENT 1: PRODUTOS
const { DistributedRPCClient } = require('./distributed-rpc');
const produtos = new DistributedRPCClient('Produtos', 3002, 3);

await produtos.connect('http://localhost:9000');

produtos.registerEndpoint('listar', async (params) => {
  return { sucesso: true, produtos: [] };
});

productos.registerEndpoint('obter', async (params) => {
  return { sucesso: true, id: params.id };
});

// CLIENT 2: CLIENTES
const clientes = new DistributedRPCClient('Clientes', 3003, 2);
await clientes.connect('http://localhost:9000');

clientes.registerEndpoint('buscar', async (params) => {
  return { sucesso: true, cliente: {} };
});

// CHAMAR RPC
try {
  const resultado = await clientes.callRemote('Produtos', 'listar', {});
  console.log('Resultado:', resultado);
} catch (error) {
  console.log('Erro:', error.message);
}

═══════════════════════════════════════════════════════════════════

🎯 BENEFÍCIOS:

✅ Chamadas RPC síncronas entre serviços
✅ Fallback automático (WebSocket → Polling)
✅ Descoberta automática de serviços
✅ Eleição de líder integrada
✅ Timeouts automáticos (5s default)
✅ Broadcast para todos os serviços

═══════════════════════════════════════════════════════════════════
`);
