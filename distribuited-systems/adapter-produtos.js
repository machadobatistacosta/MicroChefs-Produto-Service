/**
 * ADAPTER - Integração do MICROSERVIÇO DE PRODUTOS com RPC
 * 
 * Mostra como adaptar seu src/app.js existente para usar Socket RPC
 * 
 * ANTES: app.js normal com Express
 * DEPOIS: app.js + DistributedRPCClient que pode ser chamado remotamente
 */

const express = require('express');
const { DistributedRPCClient } = require('./distributed-rpc');
const axios = require('axios');

// ========================================
// SIMULAÇÃO DO SEU CÓDIGO EXISTENTE
// ========================================

// Seu banco de dados atual (MongoDB Atlas)
const mockDatabase = {
  produtos: [
    { _id: '1', nome: 'Sushi', descricao: 'Arroz com salmão', preco: 45.90, estoque: 100 },
    { _id: '2', nome: 'X-Burger', descricao: 'Hamburger gourmet', preco: 32.50, estoque: 50 },
    { _id: '3', nome: 'Coca Cola', descricao: '350ml gerada', preco: 5.00, estoque: 200 }
  ]
};

// Simula seu controller atual
const produtoController = {
  // Seu método GET /api/produtos
  getAllProducts: async (req, res) => {
    try {
      return mockDatabase.produtos;
    } catch (error) {
      throw error;
    }
  },

  // Seu método GET /api/produtos/:id
  getProductById: async (productId) => {
    const produto = mockDatabase.produtos.find(p => p._id === productId);
    return produto || null;
  },

  // Seu método POST /api/produtos
  createProduct: async (nome, descricao, preco) => {
    const novo = {
      _id: String(Date.now()),
      nome,
      descricao,
      preco,
      estoque: 0
    };
    mockDatabase.produtos.push(novo);
    return novo;
  },

  // Seu método PUT /api/produtos/:id
  updateProduct: async (productId, dados) => {
    const idx = mockDatabase.produtos.findIndex(p => p._id === productId);
    if (idx === -1) return null;
    mockDatabase.produtos[idx] = { ...mockDatabase.produtos[idx], ...dados };
    return mockDatabase.produtos[idx];
  },

  // Seu método DELETE /api/produtos/:id
  deleteProduct: async (productId) => {
    const idx = mockDatabase.produtos.findIndex(p => p._id === productId);
    if (idx === -1) return false;
    mockDatabase.produtos.splice(idx, 1);
    return true;
  }
};

// ========================================
// INICIALIZAR RPC CLIENT
// ========================================

console.log(`
╔════════════════════════════════════════════════════════════════╗
║        MICROSERVIÇO PRODUTOS COM RPC INTEGRADO                 ║
║                                                                ║
║  Componentes:                                                  ║
║  ✅ Express API (suas rotas normais)                           ║
║  ✅ Socket RPC (outros serviços podem chamar)                  ║
║  ✅ Eleição de Líder (automática via Socket)                   ║
╚════════════════════════════════════════════════════════════════╝
`);

// Criar instância RPC para seu serviço
const rpcClient = new DistributedRPCClient('Produtos', 3002, 3); // ID=3 = pode ser líder

// ========================================
// REGISTRAR ENDPOINTS RPC
// ========================================

console.log('\n📝 Registrando endpoints RPC para PRODUTOS...\n');

// Endpoint 1: Listar todos produtos
rpcClient.registerEndpoint('listar_produtos', async (params) => {
  console.log('   RPC: listar_produtos chamada');
  const produtos = await produtoController.getAllProducts();
  return {
    sucesso: true,
    produtos: produtos,
    total: produtos.length
  };
});

// Endpoint 2: Obter produto específico
rpcClient.registerEndpoint('obter_produto', async (params) => {
  console.log(`   RPC: obter_produto(${params.id})`);
  const produto = await produtoController.getProductById(params.id);
  return {
    sucesso: !!produto,
    produto: produto || null
  };
});

// Endpoint 3: Verificar estoque
rpcClient.registerEndpoint('verificar_estoque', async (params) => {
  console.log(`   RPC: verificar_estoque(${params.produtoId})`);
  const produto = await produtoController.getProductById(params.produtoId);
  if (!produto) {
    return { sucesso: false, erro: 'Produto não encontrado' };
  }
  return {
    sucesso: true,
    disponivel: produto.estoque > 0,
    quantidade: produto.estoque,
    productName: produto.nome
  };
});

// Endpoint 4: Criar produto
rpcClient.registerEndpoint('criar_produto', async (params) => {
  console.log(`   RPC: criar_produto(${params.nome})`);
  const novo = await produtoController.createProduct(
    params.nome,
    params.descricao,
    params.preco
  );
  return {
    sucesso: true,
    produto: novo
  };
});

// Endpoint 5: Atualizar produto
rpcClient.registerEndpoint('atualizar_produto', async (params) => {
  console.log(`   RPC: atualizar_produto(${params.id})`);
  const atualizado = await produtoController.updateProduct(params.id, params.dados);
  if (!atualizado) {
    return { sucesso: false, erro: 'Produto não encontrado' };
  }
  return {
    sucesso: true,
    produto: atualizado
  };
});

// Endpoint 6: Deletar produto
rpcClient.registerEndpoint('deletar_produto', async (params) => {
  console.log(`   RPC: deletar_produto(${params.id})`);
  const deleted = await produtoController.deleteProduct(params.id);
  return {
    sucesso: deleted,
    erro: deleted ? null : 'Produto não encontrado'
  };
});

// ========================================
// CONECTAR AO ORQUESTRADOR
// ========================================

console.log('🔌 Conectando ao Orquestrador (9000)...\n');

rpcClient.connect('http://localhost:9000')
  .then(() => {
    console.log('✅ Conectado com sucesso!\n');
  })
  .catch((error) => {
    console.log('⚠️  Não conseguiu conectar ao orquestrador:', error.message);
    console.log('   Continuando em modo local (será isolado)\n');
  });

// ========================================
// APLICAÇÃO EXPRESS
// ========================================

const app = express();
app.use(express.json());

// ========================================
// ROTAS EXPRESS NORMAIS
// ========================================

// GET /api/produtos - Listar (ROTA NORMAL)
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await produtoController.getAllProducts();
    res.json({
      sucesso: true,
      produtos,
      total: produtos.length,
      origem: 'Express API (local)'
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// GET /api/produtos/:id - Obter um (ROTA NORMAL)
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await produtoController.getProductById(req.params.id);
    if (!produto) {
      return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado' });
    }
    res.json({ sucesso: true, produto, origem: 'Express API (local)' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// POST /api/produtos - Criar (ROTA NORMAL)
app.post('/api/produtos', async (req, res) => {
  try {
    const { nome, descricao, preco } = req.body;
    const produto = await produtoController.createProduct(nome, descricao, preco);
    res.status(201).json({ sucesso: true, produto, origem: 'Express API (local)' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// PUT /api/produtos/:id - Atualizar (ROTA NORMAL)
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await produtoController.updateProduct(req.params.id, req.body);
    if (!produto) {
      return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado' });
    }
    res.json({ sucesso: true, produto, origem: 'Express API (local)' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// DELETE /api/produtos/:id - Deletar (ROTA NORMAL)
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const sucesso = await produtoController.deleteProduct(req.params.id);
    if (!sucesso) {
      return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado' });
    }
    res.json({ sucesso: true, origem: 'Express API (local)' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// ========================================
// ROTAS COM CHAMADA RPC PARA OUTROS SERVIÇOS
// ========================================

// POST /api/pedidos/novo - Criar pedido validando com RPC
app.post('/api/pedidos/novo', async (req, res) => {
  try {
    const { clienteId, produtosIds } = req.body;

    console.log(`\n📥 POST /api/pedidos/novo recebido`);
    console.log(`   Cliente: ${clienteId}`);
    console.log(`   Produtos: ${produtosIds.join(', ')}`);

    // 1. Chamar CLIENTES via RPC para validar cliente
    console.log(`\n   1️⃣ Validando cliente via RPC...`);
    let clienteResult;
    try {
      clienteResult = await rpcClient.callRemote('Clientes', 'buscar', {
        id: clienteId
      });
      console.log(`   ✅ Cliente validado: ${clienteResult.cliente?.nome}`);
    } catch (error) {
      console.log(`   ⚠️  Clientes indisponível, continuando...`);
      // Se Clientes cair, continua mesmo assim
      clienteResult = { cliente: { id: clienteId, nome: 'Desconhecido' } };
    }

    // 2. Verificar estoque de todos os produtos
    console.log(`\n   2️⃣ Verificando estoque...`);
    for (let prodId of produtosIds) {
      const estoque = await produtoController.getProductById(prodId);
      if (!estoque) {
        return res.status(400).json({
          sucesso: false,
          erro: `Produto ${prodId} não encontrado`
        });
      }
      if (estoque.estoque <= 0) {
        return res.status(400).json({
          sucesso: false,
          erro: `Produto ${estoque.nome} sem estoque`
        });
      }
      console.log(`      ✅ ${estoque.nome}: ${estoque.estoque} unidades`);
    }

    // 3. Chamar PEDIDOS via RPC para criar o pedido
    console.log(`\n   3️⃣ Criando pedido via RPC...`);
    let pedidoResult;
    try {
      pedidoResult = await rpcClient.callRemote('Pedidos', 'criar', {
        clienteId,
        produtosIds,
        total: 199.90 // Simulado
      });
      console.log(`   ✅ Pedido criado: ${pedidoResult.id}`);
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        erro: `Erro ao criar pedido: ${error.message}`
      });
    }

    // 4. Responder com sucesso
    res.status(201).json({
      sucesso: true,
      pedido: {
        id: pedidoResult.id,
        cliente: clienteResult.cliente,
        produtos: produtosIds,
        total: 199.90
      },
      origem: 'Express API com RPC integrado'
    });

  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// GET /api/status - Ver status do sistema distribuído
app.get('/api/status', (req, res) => {
  res.json({
    servico: 'Produtos',
    porta: 3002,
    rpc: rpcClient.getStatus(),
    bancoInterno: {
      totalProdutos: mockDatabase.produtos.length,
      produtos: mockDatabase.produtos
    }
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}\n`);
  console.log(`📋 API ENDPOINTS (Express - normais):`);
  console.log(`   GET    /api/produtos              Listar`);
  console.log(`   GET    /api/produtos/:id          Obter um`);
  console.log(`   POST   /api/produtos              Criar`);
  console.log(`   PUT    /api/produtos/:id          Atualizar`);
  console.log(`   DELETE /api/produtos/:id          Deletar`);
  console.log(`\n📡 RPC ENDPOINTS (para outros serviços chamarem):`);
  console.log(`   listar_produtos`);
  console.log(`   obter_produto`);
  console.log(`   verificar_estoque`);
  console.log(`   criar_produto`);
  console.log(`   atualizar_produto`);
  console.log(`   deletar_produto`);
  console.log(`\n🌐 ROTAS COM RPC INTEGRADO:`);
  console.log(`   POST   /api/pedidos/novo         (Cria pedido validando via RPC)`);
  console.log(`\n📊 ROTA DE STATUS:`);
  console.log(`   GET    /api/status               (Ver status do sistema distribuído)`);
  console.log(`\n${'═'.repeat(60)}\n`);
});

// ========================================
// EXPORT PARA TESTES
// ========================================

module.exports = { app, rpcClient, produtoController };

console.log(`
💡 PRÓXIMOS PASSOS:

1. Rode o orquestrador em outro terminal:
   node distributed-rpc.js

2. Inicie este servidor:
   node adapter-produtos.js

3. Teste as rotas:
   - GET http://localhost:3002/api/produtos
   - POST http://localhost:3002/api/produtos (com JSON)
   - POST http://localhost:3002/api/pedidos/novo (com clienteId e produtosIds)

4. Veja o status distribuído:
   - GET http://localhost:3002/api/status

═══════════════════════════════════════════════════════════════════════

✅ AGORA você tem:
   • Sua API normal funcionando
   • RPC disponível para outros serviços
   • Integração com orquestrador automática
   • Eleição de líder automática

═══════════════════════════════════════════════════════════════════════
`);
