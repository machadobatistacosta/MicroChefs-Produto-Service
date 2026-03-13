/**
 * 🧪 EXEMPLOS PRÁTICOS DE TESTE
 * 
 * Use este código com Postman, curl, ou node para testar o sistema
 * 
 * PRÉ-REQUISITOS:
 * Terminal 1: node distributed-rpc.js (orquestrador)
 * Terminal 2: node adapter-produtos.js (API produtos)
 * Terminal 3: Este arquivo (testes)
 */

const http = require('http');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║              TESTES PRÁTICOS DO SISTEMA DISTRIBUÍDO            ║
║                                                                ║
║  Exemplos com node, curl, ou Postman                           ║
╚════════════════════════════════════════════════════════════════╝

🚀 COMECE AQUI:

Terminal 1 (Orquestrador):
  cd c:\\Users\\cmbcosta\\Desktop\\ds\\distribuited-systems
  node distributed-rpc.js

Terminal 2 (Produtos API):
  node adapter-produtos.js

Terminal 3 (Este arquivo):
  node exemplo-testes.js

`);

// ========================================
// HELPER: Fazer requisições HTTP
// ========================================

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// ========================================
// TESTES
// ========================================

async function runTests() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('🧪 INICIANDO TESTES');
  console.log('═'.repeat(60) + '\n');

  try {
    // ===== TESTE 1: GET /api/produtos =====
    console.log('TESTE 1️⃣ : GET /api/produtos');
    console.log('─'.repeat(60));
    console.log('curl http://localhost:3002/api/produtos');
    console.log('\nEsperado: Lista de produtos');
    const test1 = await makeRequest('GET', '/api/produtos');
    console.log('Status:', test1.status);
    console.log('Resposta:', test1.data);
    console.log('✅ PASSOU\n');

    // ===== TESTE 2: GET /api/produtos/:id =====
    console.log('TESTE 2️⃣ : GET /api/produtos/:id');
    console.log('─'.repeat(60));
    console.log('curl http://localhost:3002/api/produtos/1');
    console.log('\nEsperado: Um produto específico');
    const test2 = await makeRequest('GET', '/api/produtos/1');
    console.log('Status:', test2.status);
    console.log('Resposta:', test2.data);
    console.log('✅ PASSOU\n');

    // ===== TESTE 3: POST /api/produtos =====
    console.log('TESTE 3️⃣ : POST /api/produtos');
    console.log('─'.repeat(60));
    console.log(`curl -X POST http://localhost:3002/api/produtos \\
  -H "Content-Type: application/json" \\
  -d '{"nome":"Pizza Margherita","descricao":"Clássica","preco":35.90}'`);
    console.log('\nEsperado: Produto criado');
    const test3 = await makeRequest('POST', '/api/produtos', {
      nome: 'Pizza Margherita',
      descricao: 'Clássica com tomate e mozarela',
      preco: 35.90
    });
    console.log('Status:', test3.status);
    console.log('Resposta:', test3.data);
    console.log('✅ PASSOU\n');

    // ===== TESTE 4: GET /api/status =====
    console.log('TESTE 4️⃣ : GET /api/status (Sistema Distribuído)');
    console.log('─'.repeat(60));
    console.log('curl http://localhost:3002/api/status');
    console.log('\nEsperado: Status da conexão RPC e banco de dados');
    const test4 = await makeRequest('GET', '/api/status');
    console.log('Status:', test4.status);
    console.log('Resposta:', JSON.stringify(test4.data, null, 2));
    console.log('✅ PASSOU\n');

    // ===== TESTE 5: POST /api/pedidos/novo =====
    console.log('TESTE 5️⃣ : POST /api/pedidos/novo (RPC Integration)');
    console.log('─'.repeat(60));
    console.log(`curl -X POST http://localhost:3002/api/pedidos/novo \\
  -H "Content-Type: application/json" \\
  -d '{"clienteId":"c1","produtosIds":["1","2"]}'`);
    console.log('\nEsperado: Chamadas RPC para validar cliente e criar pedido');
    const test5 = await makeRequest('POST', '/api/pedidos/novo', {
      clienteId: 'c1',
      produtosIds: ['1', '2']
    });
    console.log('Status:', test5.status);
    console.log('Resposta:', JSON.stringify(test5.data, null, 2));
    console.log('✅ PASSOU\n');

    // ===== TESTE 6: PUT /api/produtos/:id =====
    console.log('TESTE 6️⃣ : PUT /api/produtos/:id');
    console.log('─'.repeat(60));
    console.log(`curl -X PUT http://localhost:3002/api/produtos/1 \\
  -H "Content-Type: application/json" \\
  -d '{"preco":49.90}'`);
    console.log('\nEsperado: Produto atualizado');
    const test6 = await makeRequest('PUT', '/api/produtos/1', {
      preco: 49.90
    });
    console.log('Status:', test6.status);
    console.log('Resposta:', test6.data);
    console.log('✅ PASSOU\n');

    // ===== TESTE 7: DELETE /api/produtos/:id =====
    console.log('TESTE 7️⃣ : DELETE /api/produtos/:id');
    console.log('─'.repeat(60));
    console.log('curl -X DELETE http://localhost:3002/api/produtos/1');
    console.log('\nEsperado: Produto deletado');
    const test7 = await makeRequest('DELETE', '/api/produtos/1');
    console.log('Status:', test7.status);
    console.log('Resposta:', test7.data);
    console.log('✅ PASSOU\n');

    console.log('═'.repeat(60));
    console.log('✨ TODOS OS TESTES PASSARAM!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.log('\n❌ ERRO:', error.message);
    console.log('\nDica: Certifique-se que:');
    console.log('  1. node distributed-rpc.js está rodando');
    console.log('  2. node adapter-produtos.js está rodando');
    console.log('  3. Porta 3002 está disponível');
  }
}

// ========================================
// EXEMPLOS COM CURL
// ========================================

console.log(`

════════════════════════════════════════════════════════════════
📝 EXEMPLOS COM CURL (para testar no terminal)
════════════════════════════════════════════════════════════════

1️⃣ LISTAR PRODUTOS:
─────────────────────────────────────────────────────────────
curl http://localhost:3002/api/produtos

Resposta esperada:
{
  "sucesso": true,
  "produtos": [
    { "_id": "1", "nome": "Sushi", "preco": 45.90 },
    { "_id": "2", "nome": "X-Burger", "preco": 32.50 }
  ],
  "total": 2
}


2️⃣ OBTER PRODUTO ESPECÍFICO:
─────────────────────────────────────────────────────────────
curl http://localhost:3002/api/produtos/1

Resposta esperada:
{
  "sucesso": true,
  "produto": {
    "_id": "1",
    "nome": "Sushi",
    "descricao": "Arroz com salmão",
    "preco": 45.90,
    "estoque": 100
  }
}


3️⃣ CRIAR NOVO PRODUTO:
─────────────────────────────────────────────────────────────
curl -X POST http://localhost:3002/api/produtos \\
  -H "Content-Type: application/json" \\
  -d '{
    "nome": "Lasanha",
    "descricao": "Italiana com carne moída",
    "preco": 42.50
  }'

Resposta esperada:
{
  "sucesso": true,
  "produto": {
    "_id": "1710333612345",
    "nome": "Lasanha",
    "descricao": "Italiana com carne moída",
    "preco": 42.50,
    "estoque": 0
  }
}


4️⃣ ATUALIZAR PRODUTO:
─────────────────────────────────────────────────────────────
curl -X PUT http://localhost:3002/api/produtos/1 \\
  -H "Content-Type: application/json" \\
  -d '{
    "preco": 48.90,
    "estoque": 50
  }'

Resposta esperada:
{
  "sucesso": true,
  "produto": {
    "_id": "1",
    "nome": "Sushi",
    "preco": 48.90,
    "estoque": 50
  }
}


5️⃣ DELETAR PRODUTO:
─────────────────────────────────────────────────────────────
curl -X DELETE http://localhost:3002/api/produtos/1

Resposta esperada:
{
  "sucesso": true
}


6️⃣ VER STATUS DO SISTEMA DISTRIBUÍDO:
─────────────────────────────────────────────────────────────
curl http://localhost:3002/api/status

Resposta esperada:
{
  "servico": "Produtos",
  "porta": 3002,
  "rpc": {
    "service": "Produtos",
    "id": 3,
    "port": 3002,
    "isConnected": true,
    "endpoints": [
      "listar_produtos",
      "obter_produto",
      "verificar_estoque",
      ...
    ],
    "discoveredServices": ["Clientes", "Pedidos"],
    "pendingRequests": 0
  },
  "bancoInterno": {
    "totalProdutos": 3,
    "produtos": [...]
  }
}


7️⃣ CRIAR PEDIDO (chama RPC para outros serviços):
─────────────────────────────────────────────────────────────
curl -X POST http://localhost:3002/api/pedidos/novo \\
  -H "Content-Type: application/json" \\
  -d '{
    "clienteId": "c1",
    "produtosIds": ["1", "2", "3"]
  }'

Resposta esperada:
{
  "sucesso": true,
  "pedido": {
    "id": "ped1710333612345",
    "cliente": {
      "id": "c1",
      "nome": "João Silva"
    },
    "produtos": ["1", "2", "3"],
    "total": 199.90
  },
  "origem": "Express API com RPC integrado"
}

════════════════════════════════════════════════════════════════

`);

// ========================================
// EXEMPLOS COM POSTMAN
// ========================================

console.log(`

════════════════════════════════════════════════════════════════
📮 CONFIGURAÇÃO NO POSTMAN
════════════════════════════════════════════════════════════════

1. Crie uma Collection "Sistema Distribuído"

2. Adicione as requisições:

   [GET] Listar Produtos
   URL: http://localhost:3002/api/produtos
   Headers: (none)
   Body: (none)

   [GET] Obter Produto
   URL: http://localhost:3002/api/produtos/{{productId}}
   Headers: (none)
   Body: (none)

   [POST] Criar Produto
   URL: http://localhost:3002/api/produtos
   Headers: Content-Type: application/json
   Body (raw JSON):
   {
     "nome": "Açaí",
     "descricao": "Com granola e mel",
     "preco": 22.50
   }

   [PUT] Atualizar Produto
   URL: http://localhost:3002/api/produtos/{{productId}}
   Headers: Content-Type: application/json
   Body (raw JSON):
   {
     "preco": 25.00,
     "estoque": 100
   }

   [DELETE] Deletar Produto
   URL: http://localhost:3002/api/produtos/{{productId}}
   Headers: (none)
   Body: (none)

   [GET] Status RPC
   URL: http://localhost:3002/api/status
   Headers: (none)
   Body: (none)

   [POST] Novo Pedido (RPC)
   URL: http://localhost:3002/api/pedidos/novo
   Headers: Content-Type: application/json
   Body (raw JSON):
   {
     "clienteId": "c1",
     "produtosIds": ["1", "2"]
   }

Dica: Use {{productId}} como variável de Collection

════════════════════════════════════════════════════════════════

`);

// ========================================
// EXECUTAR TESTES
// ========================================

async function main() {
  // Aguardar um pouco para os servidores iniciarem
  console.log('\n⏳ Aguardando servidores iniciarem...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await runTests();

  console.log(`

════════════════════════════════════════════════════════════════
✅ O QUE VOCÊ VERIA EM CADA TESTE
════════════════════════════════════════════════════════════════

1️⃣ GET /api/produtos
   ├─ Vem do banco de dados local
   └─ Sem chamadas RPC (é local)

2️⃣ GET /api/produtos/1
   ├─ Busca por ID
   └─ Sem chamadas RPC

3️⃣ POST /api/produtos
   ├─ Cria um novo produto
   ├─ ID é gerado com timestamp
   └─ Armazenado na memória

4️⃣ GET /api/status ⭐ IMPORTANTE
   ├─ Mostra qual o estado da conexão RPC
   ├─ Mostra quais endpoints estão registrados
   ├─ Mostra quais serviços foram descobertos
   └─ Se "isConnected": true → RPC está funcionando!

5️⃣ POST /api/pedidos/novo ⭐⭐ IMPORTANTE
   ├─ Valida cliente (RPC para Clientes, que pode não existir)
   ├─ Verifica estoque local
   ├─ Cria pedido (RPC para Pedidos, que pode não existir)
   └─ Com sistema distribuído completo, vê os 3 falando!

════════════════════════════════════════════════════════════════

🎯 PRÓXIMOS PASSOS:

1. Execute este arquivo: node exemplo-testes.js
2. Veja todos os 7 testes rodarem
3. Use curl/Postman para testar manualmente
4. Modifique a porta/host conforme necessário
5. Quando integrar com colegas, rode integration-example.js

════════════════════════════════════════════════════════════════
`);
}

// Rodar testes se execute direto
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest, runTests };
