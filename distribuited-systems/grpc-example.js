/**
 * EXEMPLO gRPC - Comunicação entre Microserviços
 * 
 * gRPC é um framework RPC de alta performance que usa Protocol Buffers
 * e HTTP/2 para comunicação entre serviços.
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

console.log(`
╔═════════════════════════════════════════════════════════════╗
║           EXEMPLO gRPC - SISTEMAS DISTRIBUÍDOS             ║
║         Comunicação entre Microserviços com gRPC           ║
╚═════════════════════════════════════════════════════════════╝

📚 CONCEITOS gRPC:

1. PROTOCOL BUFFERS (Proto Files)
   └─ Define interface de serviço
   └─ Serialização eficiente
   └─ Versionamento de APIs

2. HTTP/2
   └─ Multiplexing de requisições
   └─ Server push
   └─ Compressão automática

3. TIPOS DE RPC
   └─ Unary RPC: Cliente → Servidor (1 req, 1 res)
   └─ Server Streaming: Cliente → Servidor (1 req, múltiplas res)
   └─ Client Streaming: Cliente (múltiplas req) → Servidor
   └─ Bidirectional Streaming: Ambos enviam múltiplas mensagens

═══════════════════════════════════════════════════════════════

EXEMPLO PRÁTICO - Serviço de Produtos
`);

// ========================================
// DEFINIÇÃO DO SERVIÇO (Proto Definition)
// ========================================

const protoDefinition = {
  packages: {
    'produto.v1': {
      files: {
        'produto.proto': {
          package: 'produto.v1',
          syntax: 'proto3',
          messages: [
            {
              name: 'Produto',
              fields: {
                id: { rule: 'optional', type: 'string', id: 1 },
                nome: { rule: 'optional', type: 'string', id: 2 },
                preco: { rule: 'optional', type: 'double', id: 3 },
                categoria: { rule: 'optional', type: 'string', id: 4 }
              }
            },
            {
              name: 'GetProdutoRequest',
              fields: {
                id: { rule: 'optional', type: 'string', id: 1 }
              }
            },
            {
              name: 'ListaProdutosResponse',
              fields: {
                produtos: { 
                  rule: 'repeated', 
                  type: 'Produto', 
                  id: 1 
                },
                total: { rule: 'optional', type: 'int32', id: 2 }
              }
            },
            {
              name: 'CriarProdutoRequest',
              fields: {
                nome: { rule: 'optional', type: 'string', id: 1 },
                preco: { rule: 'optional', type: 'double', id: 2 },
                categoria: { rule: 'optional', type: 'string', id: 3 }
              }
            }
          ],
          services: {
            ProdutoService: {
              methods: {
                ListarProdutos: {
                  requestType: 'google.protobuf.Empty',
                  responseType: 'ListaProdutosResponse',
                  requestStream: false,
                  responseStream: false
                },
                ObterProduto: {
                  requestType: 'GetProdutoRequest',
                  responseType: 'Produto',
                  requestStream: false,
                  responseStream: false
                },
                CriarProduto: {
                  requestType: 'CriarProdutoRequest',
                  responseType: 'Produto',
                  requestStream: false,
                  responseStream: false
                },
                StreamProdutos: {
                  requestType: 'google.protobuf.Empty',
                  responseType: 'Produto',
                  requestStream: false,
                  responseStream: true
                }
              }
            }
          }
        }
      }
    }
  }
};

// ========================================
// IMPLEMENTAÇÃO DO SERVIDOR gRPC
// ========================================

class ProdutoService {
  constructor() {
    this.produtos = [
      { id: '1', nome: 'X-Burger', preco: 28.90, categoria: 'Lanches' },
      { id: '2', nome: 'Sushi', preco: 67.99, categoria: 'Japão' },
      { id: '3', nome: 'Pizza', preco: 45.00, categoria: 'Itália' }
    ];
  }

  listarProdutos(call, callback) {
    callback(null, {
      produtos: this.produtos,
      total: this.produtos.length
    });
  }

  obterProduto(call, callback) {
    const produto = this.produtos.find(p => p.id === call.request.id);
    
    if (!produto) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: 'Produto não encontrado'
      });
    } else {
      callback(null, produto);
    }
  }

  criarProduto(call, callback) {
    const novoProduto = {
      id: String(this.produtos.length + 1),
      nome: call.request.nome,
      preco: call.request.preco,
      categoria: call.request.categoria
    };
    
    this.produtos.push(novoProduto);
    callback(null, novoProduto);
  }

  streamProdutos(call) {
    // Server Streaming: envia múltiplos produtos
    this.produtos.forEach(produto => {
      call.write(produto);
    });
    call.end();
  }
}

// ========================================
// ARQUITETURA gRPC
// ========================================

console.log(`

📊 ARQUITETURA gRPC:

┌─────────────────────────────────────────────────────────┐
│                    CLIENTE gRPC                         │
│                  (Browser/Mobile)                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Protocol Buffers + HTTP/2
                       │ (Multiplexing, Compressão)
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    SERVIDOR gRPC                        │
│                  (Node.js, Go, etc)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │          ProdutoService Implementation          │  │
│  │  ├─ ListarProdutos()                            │  │
│  │  ├─ ObterProduto(id)                            │  │
│  │  ├─ CriarProduto(data)                          │  │
│  │  └─ StreamProdutos() [Server Streaming]         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │        Database (MongoDB, PostgreSQL)           │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════

✅ VANTAGENS gRPC:

✓ Performance Alta
  └─ Usa HTTP/2 (multiplexing)
  └─ Protocol Buffers (serialização binária)
  
✓ Linguagem Agnóstica
  └─ Funciona em Java, Go, Python, Node.js, C++, etc
  
✓ Suporta Streaming
  └─ Bidirecional em tempo real
  
✓ Code Generation
  └─ Gera cliente/servidor automaticamente

═══════════════════════════════════════════════════════════

❌ DESVANTAGENS gRPC:

✗ Curva de Aprendizado
  └─ Protocol Buffers e conceitos de RPC
  
✗ Debugging Complexo
  └─ Mensagens binárias (não é legível como JSON)
  
✗ Browser Suporte Limitado
  └─ Requer gRPC-Web

═══════════════════════════════════════════════════════════

💡 CASOS DE USO:

📌 Ideal para:
   • Comunicação entre microserviços
   • APIs de alta performance
   • Serviços que precisam de streaming em tempo real
   • Sistemas que precisam suportar múltiplas linguagens

🚫 Não ideal para:
   • APIs REST públicas
   • Aplicações que requerem browser direto
   • Prototipagem rápida

═══════════════════════════════════════════════════════════
`);

module.exports = { ProdutoService, protoDefinition };

console.log('\n✓ Módulo gRPC carregado com sucesso!');
console.log('\nPara usar este exemplo em produção:');
console.log('1. npm install @grpc/grpc-js @grpc/proto-loader');
console.log('2. Criar arquivos .proto com as definições');
console.log('3. Gerar código com protoc compiler');
console.log('4. Implementar servidor gRPC');
