/**
 * INTEGRAÇÃO COMPLETA - DISTRIBUÍDO + RPC + SOCKET
 * 
 * Mostra como os 3 microserviços (Produtos, Clientes, Pedidos)
 * se comunicam via Socket + RPC com Eleição de Líder (Bully)
 * 
 * EXECUTAR ASSIM:
 * 1. node distributed-rpc.js  (inicia servidor orquestrador)
 * 2. node integration-example.js  (simula os 3 serviços)
 */

const { DistributedRPCClient, RPCOrchestrator } = require('./distributed-rpc');
const { DistributedOrchestrator } = require('./distributed-orchestrator');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         INTEGRAÇÃO: PRODUTOS + CLIENTES + PEDIDOS              ║
║         Com Socket RPC e Eleição de Líder (Bully)              ║
╚════════════════════════════════════════════════════════════════╝
`);

// ========================================
// INICIALIZAR ORQUESTRADOR
// ========================================

console.log('\n🚀 Iniciando Orquestrador (porta 9000)...\n');

const orchestrator = new RPCOrchestrator(9000);
orchestrator.start();

// ========================================
// MICROSERVIÇO: PRODUTOS
// ========================================

async function initProdutos() {
  const produtos = new DistributedRPCClient('Produtos', 3002, 3); // ID=3 (Pode ser líder)

  // Registrar endpoints
  produtos.registerEndpoint('listar', async (params) => {
    console.log(`   📦 Listando produtos...`);
    // Em produção, seria query no MongoDB
    const produtosList = [
      { id: 'p1', nome: 'Sushi', preco: 45.90 },
      { id: 'p2', nome: 'X-Burger', preco: 32.50 },
      { id: 'p3', nome: 'Coca Cola', preco: 5.00 }
    ];
    return { sucesso: true, produtos: produtosList };
  });

  produtos.registerEndpoint('obter', async (params) => {
    console.log(`   📦 Obtendo produto ${params.id}...`);
    const produtoMap = {
      'p1': { id: 'p1', nome: 'Sushi', preco: 45.90, descricao: 'Arroz com salmão' },
      'p2': { id: 'p2', nome: 'X-Burger', preco: 32.50, descricao: 'Hamburger gourmet' },
      'p3': { id: 'p3', nome: 'Coca Cola', preco: 5.00, descricao: '350ml' }
    };
    return { 
      sucesso: true, 
      produto: produtoMap[params.id] || null 
    };
  });

  produtos.registerEndpoint('criar', async (params) => {
    console.log(`   📦 Criando produto: ${params.nome}...`);
    return { 
      sucesso: true, 
      id: 'p' + Date.now(),
      nome: params.nome,
      preco: params.preco
    };
  });

  productos.registerEndpoint('verificar_estoque', async (params) => {
    console.log(`   📦 Verificando estoque para ${params.produtoId}...`);
    return { 
      sucesso: true, 
      disponivel: true, 
      quantidade: 100 
    };
  });

  // Conectar ao orquestrador
  try {
    await productos.connect('http://localhost:9000');
    console.log('✅ [Produtos] Conectado com sucesso!\n');
    return productos;
  } catch (error) {
    console.log('❌ [Produtos] Erro ao conectar:', error.message);
    return null;
  }
}

// ========================================
// MICROSERVIÇO: CLIENTES
// ========================================

async function initClientes() {
  const clientes = new DistributedRPCClient('Clientes', 3003, 2); // ID=2

  clientes.registerEndpoint('buscar', async (params) => {
    console.log(`   👤 Buscando cliente ${params.id}...`);
    // Em produção, seria query no MongoDB
    const clientesMap = {
      'c1': { id: 'c1', nome: 'João Silva', email: 'joao@email.com', cpf: '12345678900' },
      'c2': { id: 'c2', nome: 'Maria Santos', email: 'maria@email.com', cpf: '98765432100' }
    };
    return { 
      sucesso: true, 
      cliente: clientesMap[params.id] || null 
    };
  });

  clientes.registerEndpoint('validar_cpf', async (params) => {
    console.log(`   👤 Validando CPF: ${params.cpf}...`);
    // Simular validação
    const valido = params.cpf.length === 11;
    return { 
      sucesso: true, 
      valido: valido,
      mensagem: valido ? 'CPF válido' : 'CPF inválido'
    };
  });

  clientes.registerEndpoint('criar', async (params) => {
    console.log(`   👤 Criando cliente: ${params.nome}...`);
    return { 
      sucesso: true, 
      id: 'c' + Date.now(),
      nome: params.nome,
      email: params.email
    };
  });

  clientes.registerEndpoint('listar_pedidos', async (params) => {
    console.log(`   👤 Listando pedidos do cliente ${params.clienteId}...`);
    return { 
      sucesso: true, 
      pedidos: [],
      total: 0
    };
  });

  try {
    await clientes.connect('http://localhost:9000');
    console.log('✅ [Clientes] Conectado com sucesso!\n');
    return clientes;
  } catch (error) {
    console.log('❌ [Clientes] Erro ao conectar:', error.message);
    return null;
  }
}

// ========================================
// MICROSERVIÇO: PEDIDOS
// ========================================

async function initPedidos() {
  const pedidos = new DistributedRPCClient('Pedidos', 3004, 1); // ID=1

  pedidos.registerEndpoint('criar', async (params) => {
    console.log(`   📋 Criando pedido para cliente ${params.clienteId}...`);
    return { 
      sucesso: true, 
      id: 'ped' + Date.now(),
      status: 'pendente',
      clienteId: params.clienteId,
      itens: params.itens
    };
  });

  pedidos.registerEndpoint('listar', async (params) => {
    console.log(`   📋 Listando pedidos...`);
    return { 
      sucesso: true, 
      pedidos: [],
      total: 0
    };
  });

  pedidos.registerEndpoint('calcular_total', async (params) => {
    console.log(`   📋 Calculando total do pedido...`);
    // Em produção, chamaria Produtos para pegar preços
    const subtotal = params.itens ? params.itens.length * 45 : 0;
    const taxa = subtotal * 0.1; // 10% taxa
    return { 
      sucesso: true, 
      subtotal: subtotal,
      taxa: taxa,
      total: subtotal + taxa
    };
  });

  pedidos.registerEndpoint('atualizar_status', async (params) => {
    console.log(`   📋 Atualizando status do pedido ${params.pedidoId}...`);
    return { 
      sucesso: true, 
      pedidoId: params.pedidoId,
      novoStatus: params.status
    };
  });

  pedidos.registerEndpoint('cancelar', async (params) => {
    console.log(`   📋 Cancelando pedido ${params.pedidoId}...`);
    return { 
      sucesso: true, 
      pedidoId: params.pedidoId,
      motivoCancelamento: params.motivo
    };
  });

  try {
    await pedidos.connect('http://localhost:9000');
    console.log('✅ [Pedidos] Conectado com sucesso!\n');
    return pedidos;
  } catch (error) {
    console.log('❌ [Pedidos] Erro ao conectar:', error.message);
    return null;
  }
}

// ========================================
// FLUXO DE TESTE
// ========================================

async function runTestFlows(produtos, clientes, pedidos) {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 EXECUTANDO FLUXOS DE TESTE');
  console.log('═'.repeat(60) + '\n');

  // Aguardar um pouco para tudo conectar
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ===== FLUXO 1: Listar Produtos =====
  console.log('\n1️⃣  LISTAR PRODUTOS (Produtos RPC)');
  console.log('─'.repeat(60));
  try {
    const resultado = await produtos.callRemote('Produtos', 'listar', {});
    console.log('✅ Resultado:', resultado.produtos);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // ===== FLUXO 2: Validar Cliente =====
  console.log('\n2️⃣  VALIDAR CLIENTE (Clientes RPC)');
  console.log('─'.repeat(60));
  try {
    const resultado = await clientes.callRemote('Clientes', 'buscar', {
      id: 'c1'
    });
    console.log('✅ Cliente encontrado:', resultado.cliente);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // ===== FLUXO 3: Cross-service RPC (Pedidos chama Clientes) =====
  console.log('\n3️⃣  CROSS-SERVICE: Buscar Cliente (Pedidos→Clientes)');
  console.log('─'.repeat(60));
  try {
    const resultado = await pedidos.callRemote('Clientes', 'buscar', {
      id: 'c1'
    });
    console.log('✅ Cliente encontrado de outro serviço:', resultado.cliente.nome);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // ===== FLUXO 4: Cross-service RPC (Pedidos chama Produtos) =====
  console.log('\n4️⃣  CROSS-SERVICE: Listar Produtos (Pedidos→Produtos)');
  console.log('─'.repeat(60));
  try {
    const resultado = await pedidos.callRemote('Produtos', 'listar', {});
    console.log('✅ Produtos encontrados:', resultado.produtos.length, 'itens');
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // ===== FLUXO 5: NOVO PEDIDO COMPLETO =====
  console.log('\n5️⃣  FLUXO COMPLETO: Criar Novo Pedido');
  console.log('─'.repeat(60));
  try {
    // 1. Validar cliente
    console.log('\n   Step 1: Validando cliente...');
    const clienteResult = await pedidos.callRemote('Clientes', 'buscar', {
      id: 'c1'
    });
    console.log('   ✅ Cliente validado:', clienteResult.cliente.nome);

    // 2. Buscar produtos disponíveis
    console.log('\n   Step 2: Buscando produtos...');
    const produtosResult = await pedidos.callRemote('Produtos', 'listar', {});
    console.log('   ✅ Produtos disponíveis:', produtosResult.produtos.length);

    // 3. Calcular total
    console.log('\n   Step 3: Calculando total...');
    const totalResult = await pedidos.callRemote('Pedidos', 'calcular_total', {
      itens: [produtosResult.produtos[0], produtosResult.produtos[1]]
    });
    console.log('   ✅ Total do pedido: R$', totalResult.total);

    // 4. Criar pedido
    console.log('\n   Step 4: Criando pedido...');
    const pedidoResult = await pedidos.callRemote('Pedidos', 'criar', {
      clienteId: 'c1',
      itens: ['p1', 'p2'],
      total: totalResult.total
    });
    console.log('   ✅ Pedido criado:', pedidoResult.id);

    console.log('\n✨ FLUXO COMPLETO EXECUTADO COM SUCESSO!');

  } catch (error) {
    console.log('❌ Erro no fluxo:', error.message);
  }

  // ===== FLUXO 6: Status de todos os serviços =====
  console.log('\n\n6️⃣  STATUS DO SISTEMA');
  console.log('─'.repeat(60));
  console.log('Produtos:', produtos.getStatus());
  console.log('Clientes:', clientes.getStatus());
  console.log('Pedidos:', pedidos.getStatus());

  // ===== FLUXO 7: Simular falha de serviço =====
  console.log('\n7️⃣  SIMULANDO FALHA DE SERVIÇO (Produtos desconecta)');
  console.log('─'.repeat(60));
  console.log('⚠️  Desconectando Produtos...');
  produtos.disconnect();

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n❌ Tentando chamar Produtos (deve falhar)...');
  try {
    await pedidos.callRemote('Produtos', 'listar', {});
  } catch (error) {
    console.log('✅ Falha esperada:', error.message);
  }

  console.log('\n👍 TODOS OS TESTES CONCLUÍDOS!');
}

// ========================================
// EXECUTAR
// ========================================

async function main() {
  try {
    // Esperar orquestrador iniciar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Inicializar os 3 microserviços
    const produtos = await initProdutos();
    const clientes = await initClientes();
    const pedidos = await initPedidos();

    if (!produtos || !clientes || !pedidos) {
      console.log('\n❌ Erro ao inicializar serviços');
      process.exit(1);
    }

    // Executar testes
    await runTestFlows(produtos, clientes, pedidos);

    // Manter processo vivo
    console.log('\n\n💯 Sistema rodando... (Pressione Ctrl+C para parar)');

  } catch (error) {
    console.log('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();
