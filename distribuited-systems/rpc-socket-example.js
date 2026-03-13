/**
 * EXEMPLO RPC com Socket.io
 * 
 * RPC (Remote Procedure Call) permite chamar funções em máquinas remotas
 * como se fossem locais. Socket.io oferece comunicação em tempo real.
 */

const EventEmitter = require('events');

console.log(`
╔═════════════════════════════════════════════════════════════╗
║         EXEMPLO RPC com Socket.io - DISTRIBUÍDO            ║
║      Chamadas de Funções Remotas em Tempo Real             ║
╚═════════════════════════════════════════════════════════════╝

📚 CONCEITOS RPC:

1. REMOTE PROCEDURE CALL
   └─ Chama função em outra máquina como se fosse local
   └─ Abstrai complexidade da comunicação
   └─ Retorna resultado síncrono ou assíncrono

2. SOCKET.IO
   └─ Comunicação bidirecional em tempo real
   └─ Fallback automático (WebSocket → Long-polling)
   └─ Rooms e Namespaces para organização

3. PADRÃO REQUEST/REPLY
   └─ Cliente: Envia requisição com ID único
   └─ Servidor: Processa e retorna resultado
   └─ Cliente: Recebe resultado e executa callback

═══════════════════════════════════════════════════════════════

EXEMPLO PRÁTICO - RPC de Múltiplos Serviços
`);

// ========================================
// CLIENTE RPC
// ========================================

class RPCClient extends EventEmitter {
  constructor(socketIO) {
    super();
    this.socket = socketIO;
    this.callId = 0;
    this.callbacks = new Map();
    
    this.socket.on('rpc:response', (data) => {
      const { id, error, result } = data;
      const callback = this.callbacks.get(id);
      
      if (callback) {
        this.callbacks.delete(id);
        if (error) {
          callback(new Error(error));
        } else {
          callback(null, result);
        }
      }
    });
  }

  call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const callId = ++this.callId;
      const timeout = setTimeout(() => {
        this.callbacks.delete(callId);
        reject(new Error('RPC timeout'));
      }, 5000);

      this.callbacks.set(callId, (err, result) => {
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve(result);
      });

      this.socket.emit('rpc:call', {
        id: callId,
        method,
        params
      });
    });
  }
}

// ========================================
// SERVIDOR RPC
// ========================================

class RPCServer extends EventEmitter {
  constructor(socketIO) {
    super();
    this.socket = socketIO;
    this.methods = new Map();
    
    this.socket.on('rpc:call', async (data) => {
      const { id, method, params } = data;
      
      try {
        const handler = this.methods.get(method);
        
        if (!handler) {
          throw new Error(`Método '${method}' não encontrado`);
        }

        const result = await handler(params);
        
        this.socket.emit('rpc:response', {
          id,
          error: null,
          result
        });
      } catch (error) {
        this.socket.emit('rpc:response', {
          id,
          error: error.message,
          result: null
        });
      }
    });
  }

  register(method, handler) {
    this.methods.set(method, handler);
  }
}

// ========================================
// SERVIÇOS RPC
// ========================================

class ProdutoServiceRPC {
  constructor() {
    this.produtos = [
      { id: '1', nome: 'X-Burger', preco: 28.90 },
      { id: '2', nome: 'Sushi', preco: 67.99 },
      { id: '3', nome: 'Pizza', preco: 45.00 }
    ];
  }

  listar() {
    return {
      sucesso: true,
      produtos: this.produtos,
      total: this.produtos.length
    };
  }

  obter(params) {
    const produto = this.produtos.find(p => p.id === params.id);
    
    if (!produto) {
      throw new Error('Produto não encontrado');
    }

    return {
      sucesso: true,
      produto
    };
  }

  criar(params) {
    const novoProduto = {
      id: String(this.produtos.length + 1),
      nome: params.nome,
      preco: params.preco
    };

    this.produtos.push(novoProduto);

    return {
      sucesso: true,
      produto: novoProduto
    };
  }

  buscarPorCategoria(params) {
    // Simula busca em categoria
    return {
      sucesso: true,
      categoria: params.categoria,
      produtos: this.produtos.slice(0, 2),
      total: 2
    };
  }
}

// ========================================
// EXEMPLO DE USO
// ========================================

console.log(`

📊 ARQUITETURA RPC com Socket.io:

┌────────────────────────────────────────────────────────┐
│              CLIENTE (Browser/App)                     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ RPCClient                                        │ │
│  │ ┌────────────────────────────────────────────┐  │ │
│  │ │ Métodos Disponíveis:                       │  │ │
│  │ │ • await client.call('produto:listar')      │  │ │
│  │ │ • await client.call('produto:obter', {..}) │  │ │
│  │ │ • await client.call('produto:criar', {..}) │  │ │
│  │ └────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────┘
                     │
         Socket.io (WebSocket + Fallback)
                     │
┌────────────────────▼─────────────────────────────────┐
│             SERVIDOR (Node.js)                       │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ RPCServer                                    │  │
│  │ ┌────────────────────────────────────────────┐│  │
│  │ │ Métodos Registrados:                      ││  │
│  │ │ • 'produto:listar' → ProdutoServiceRPC    ││  │
│  │ │ • 'produto:obter'  → ProdutoServiceRPC    ││  │
│  │ │ • 'produto:criar'  → ProdutoServiceRPC    ││  │
│  │ │ • 'produto:buscar' → ProdutoServiceRPC    ││  │
│  │ └────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │        Database (MongoDB, PostgreSQL)        │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════

FLOW DE UMA CHAMADA RPC:

1. Cliente chama: await client.call('produto:listar')
   └─ Gera ID único (ex: 42)
   └─ Emite evento 'rpc:call' com {id: 42, method: '...'}

2. Servidor recebe 'rpc:call'
   └─ Encontra handler registrado
   └─ Executa handler com parâmetros
   └─ Emite 'rpc:response' com {id: 42, result: {...}}

3. Cliente recebe 'rpc:response'
   └─ Procura callback com ID 42
   └─ Resolve Promise com resultado

═══════════════════════════════════════════════════════════

✅ VANTAGENS RPC Socket.io:

✓ Fácil de Entender
  └─ Chamadas de função simples
  
✓ Tempo Real
  └─ WebSocket bidirecional
  
✓ Fallback Automático
  └─ Se WebSocket falhar, usa Long-polling
  
✓ Debugging Fácil
  └─ Mensagens JSON legíveis

═══════════════════════════════════════════════════════════

❌ DESVANTAGENS RPC Socket.io:

✗ Escalabilidade Limitada
  └─ Difícil em grandes clusters
  
✗ Sem Type Safety
  └─ Sem validação automática de tipos
  
✗ Overhead de Conexão
  └─ Socket.io tem overhead comparado a gRPC

═══════════════════════════════════════════════════════════

💡 CASOS DE USO:

📌 Ideal para:
   • Chat em tempo real
   • Notificações live
   • Dashboards interativos
   • Aplicações com poucos serviços

🚫 Não ideal para:
   • Sistemas com centenas de microserviços
   • APIs de altíssima performance
   • Comunicação síncrona critica

═══════════════════════════════════════════════════════════
`);

// Exemplo de uso
const exemplo = {
  cliente: `
    const socket = io('http://server:3000');
    const rpcClient = new RPCClient(socket);
    
    // Chamar método remoto
    try {
      const resultado = await rpcClient.call('produto:listar');
      console.log(resultado);
    } catch (error) {
      console.error('Erro RPC:', error);
    }
  `,
  
  servidor: `
    const io = require('socket.io')(3000);
    const rpcServer = new RPCServer(io);
    const service = new ProdutoServiceRPC();
    
    // Registrar métodos
    rpcServer.register('produto:listar', () => service.listar());
    rpcServer.register('produto:obter', (params) => service.obter(params));
    rpcServer.register('produto:criar', (params) => service.criar(params));
  `
};

console.log('\n📝 EXEMPLO DE USO:');
console.log('\nCliente:');
console.log(exemplo.cliente);
console.log('\nServidor:');
console.log(exemplo.servidor);

module.exports = { RPCClient, RPCServer, ProdutoServiceRPC };

console.log('\n✓ Módulo RPC Socket.io carregado com sucesso!');
console.log('\nPara usar este exemplo em produção:');
console.log('1. npm install socket.io socket.io-client');
console.log('2. Configure servidor Socket.io');
console.log('3. Instancie RPCServer e registre métodos');
console.log('4. No cliente, use RPCClient para fazer chamadas');
