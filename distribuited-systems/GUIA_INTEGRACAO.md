# 🔗 Guia de Integração Distribuída do Grupo

## 📋 Resumo do Projeto

Seu grupo tem **3 microserviços** que precisam se comunicar:

1. **Seu Serviço: PRODUTOS** (Porta 3002, ID=3)
   - Listar, criar, atualizar, deletar produtos
   - Verificar estoque
   - **Pode ser LÍDER** (maior ID)

2. **Colega 1: CLIENTES** (Porta 3003, ID=2)
   - Gerenciar clientes
   - Validar CPF
   - Buscar histórico de pedidos

3. **Colega 2: PEDIDOS** (Porta 3004, ID=1)
   - Criar pedidos
   - Acompanhar status
   - Calcular total
   - Cancelar

---

## 🏗️ Arquitetura do Sistema

```
                    ┌─────────────────────────┐
                    │   ORQUESTRADOR (9000)   │
                    │  Eleição Líder (Bully)  │
                    │  Roteamento Socket RPC  │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
            ┌───────▼──┐ ┌────▼────┐ ┌──▼──────┐
            │ PRODUTOS │ │CLIENTES │ │ PEDIDOS │
            │ (3002)   │ │ (3003)  │ │ (3004)  │
            │ ID=3     │ │ ID=2    │ │ ID=1    │
            └──────────┘ └─────────┘ └─────────┘

FLUXO TÍPICO DE PEDIDO:
  1. Cliente entra no sistema (RPC para CLIENTES)
  2. Busca produtos (RPC para PRODUTOS)
  3. Cria pedido (RPC para PEDIDOS)
  4. PEDIDOS valida com CLIENTES e PRODUTOS
```

---

## 🚀 Como Implementar (Passo a Passo)

### PASSO 1: Integração do Socket ao seu `app.js` (PRODUTOS)

Adicione ao seu `src/app.js`:

```javascript
const { DistributedRPCClient } = require('../distributed-rpc');

// Inicializar RPC
const rpcClient = new DistributedRPCClient('Produtos', 3002, 3);

// Registrar endpoints que outros podem chamar
rpcClient.registerEndpoint('listar_produtos', async (params) => {
  // Sua lógica aqui - busca no MongoDB
  const produtos = await Product.find();
  return { sucesso: true, produtos };
});

rpcClient.registerEndpoint('obter_produto', async (params) => {
  const produto = await Product.findById(params.id);
  return { sucesso: true, produto };
});

rpcClient.registerEndpoint('verificar_estoque', async (params) => {
  const produto = await Product.findById(params.produtoId);
  return { 
    sucesso: true, 
    disponivel: produto.estoque > 0,
    quantidade: produto.estoque
  };
});

// Conectar ao orquestrador
rpcClient.connect('http://localhost:9000')
  .then(() => console.log('✅ Conectado ao orquestrador'))
  .catch(err => console.log('❌ Erro:', err));

// Exportar para usar em rotas
module.exports = { app, rpcClient };
```

### PASSO 2: Usar RPC nas suas rotas

Em `src/routes/productRoutes.js`:

```javascript
const router = require('express').Router();
const controller = require('../controllers/productController');
const { rpcClient } = require('../app');

// Sua rota normal
router.get('/', controller.getAllProducts);

// Rota que CHAMA outro serviço
router.post('/com-cliente', async (req, res) => {
  try {
    // Validar cliente em outro serviço
    const clienteResult = await rpcClient.callRemote('Clientes', 'buscar', {
      id: req.body.clienteId
    });

    if (!clienteResult.cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    // Criar produto
    const produto = await controller.createProduct(req, res);
    
    return res.json({ sucesso: true, produto, cliente: clienteResult.cliente });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
```

### PASSO 3: Coordenar com colega do CLIENTES

Peça ao colega adicionar a seus `src/app.js`:

```javascript
const { DistributedRPCClient } = require('../distributed-rpc');

const rpcClient = new DistributedRPCClient('Clientes', 3003, 2);

rpcClient.registerEndpoint('buscar', async (params) => {
  const cliente = await Cliente.findById(params.id);
  return { sucesso: true, cliente };
});

rpcClient.registerEndpoint('validar_cpf', async (params) => {
  // Sua lógica de validação
  return { sucesso: true, valido: params.cpf.length === 11 };
});

await rpcClient.connect('http://localhost:9000');
```

### PASSO 4: Coordenar com colega do PEDIDOS

Peça ao colega adicionar a seus `src/app.js`:

```javascript
const { DistributedRPCClient } = require('../distributed-rpc');

const rpcClient = new DistributedRPCClient('Pedidos', 3004, 1);

rpcClient.registerEndpoint('criar', async (params) => {
  // Validar cliente RPC
  const cliente = await rpcClient.callRemote('Clientes', 'buscar', {
    id: params.clienteId
  });

  if (!cliente.cliente) throw new Error('Cliente inválido');

  // Validar produtos RPC
  for (let prodId of params.produtosIds) {
    const prod = await rpcClient.callRemote('Produtos', 'obter_produto', {
      id: prodId
    });
    if (!prod.produto) throw new Error(`Produto ${prodId} não encontrado`);
  }

  // Criar pedido
  const pedido = await Pedido.create(params);
  return { sucesso: true, pedido };
});

await rpcClient.connect('http://localhost:9000');
```

---

## 🧪 Teste Rápido

### Com o Sistema Rodando:

```bash
# Terminal 1: Inicia orquestrador
cd c:\Users\cmbcosta\Desktop\ds\distribuited-systems
npm install express socket.io socket.io-client  # Se não tiver
node distributed-rpc.js

# Terminal 2: Inicia exemplo de integração
node integration-example.js
```

### Esperado:
```
✅ [Produtos] Conectado com sucesso!
✅ [Clientes] Conectado com sucesso!
✅ [Pedidos] Conectado com sucesso!

1️⃣  LISTAR PRODUTOS
✅ Resultado: [...]

2️⃣  VALIDAR CLIENTE
✅ Cliente encontrado: João Silva

3️⃣  CROSS-SERVICE: Buscar Cliente
✅ Cliente encontrado de outro serviço: João Silva

5️⃣  FLUXO COMPLETO: Criar Novo Pedido
   Step 1: Validando cliente...
   ✅ Cliente validado: João Silva
   Step 2: Buscando produtos...
   ✅ Produtos disponíveis: 3
   Step 3: Calculando total...
   ✅ Total do pedido: R$ 89.90
   Step 4: Criando pedido...
   ✅ Pedido criado: ped1234567890

✨ FLUXO COMPLETO EXECUTADO COM SUCESSO!
```

---

## 📡 Como o Socket.io se Conecta

### Vantagens do Socket.io:

```
┌─────────────────────────────────────────────┐
│         Tentativa de Conexão                │
├─────────────────────────────────────────────┤
│                                             │
│ 1️⃣  Tenta WebSocket (mais rápido)          │
│     └─ Se funciona: usa WebSocket          │
│                                             │
│ 2️⃣  Se WebSocket não funciona              │
│     └─ Fallback automático para Polling    │
│        (HTTP Long Polling)                 │
│                                             │
│ 3️⃣  Ambos funcionam em:                    │
│     • Localhost (testes)                   │
│     • Redes corporativas (com proxy)       │
│     • Servidores na nuvem                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🗳️ Eleição de Líder Automática (Bully)

Quando um serviço falha:

```
ANTES:              FALHA DE PRODUTOS:      APÓS ELEIÇÃO:
┌────────┐        ┌────────┐              ┌────────┐
│Products│        │Products│              │Products│
│ ID=3   │  ───►  │ ID=3   │       ───►   │ ID=3   │
│ LÍDER  │   ❌   │  CAÍDO │               │  CAÍDO │
└────────┘        └────────┘              └────────┘
┌────────┐        ┌────────┐              ┌────────┐
│Clientes│        │Clientes│              │Clientes│
│ ID=2   │        │ ID=2   │       ───►   │ ID=2   │
│ FOLHA  │        │ FOLHA  │              │ LÍDER  │ ⬅️ NOVO!
└────────┘        └────────┘              └────────┘
┌────────┐        ┌────────┐              ┌────────┐
│ Pedidos│        │ Pedidos│              │ Pedidos│
│ ID=1   │        │ ID=1   │       ───►   │ ID=1   │
│ FOLHA  │        │ FOLHA  │              │ FOLHA  │
└────────┘        └────────┘              └────────┘

Quem elege: Orquestrador
Critério: Maior ID entre os saudáveis
Resultado: Clientes agora é LÍDER
```

---

## 🎯 Checklist de Implementação

Para apresentar no trabalho:

- [ ] **Seus PRODUTOS rodando em 3002 com endpoints RPC**
  - [ ] `listar_produtos`
  - [ ] `obter_produto`
  - [ ] `verificar_estoque`

- [ ] **CLIENTES do colega em 3003 com endpoints RPC**
  - [ ] `buscar`
  - [ ] `validar_cpf`
  - [ ] `criar`

- [ ] **PEDIDOS do colega em 3004 com endpoints RPC**
  - [ ] `criar`
  - [ ] `listar`
  - [ ] `calcular_total`

- [ ] **Orquestrador rodando em 9000**
  - [ ] BULLY eleição funcionando
  - [ ] Descoberta automática de serviços
  - [ ] Roteamento de RPC

- [ ] **Fluxo completo**
  - [ ] Cliente faz pedido (valida dados)
  - [ ] Pedidos chama CLIENTES (valida cliente)
  - [ ] Pedidos chama PRODUTOS (verifica estoque)
  - [ ] Pedido é criado com sucesso

- [ ] **Failover**
  - [ ] Desconecta um serviço
  - [ ] Eleição de novo líder acontece
  - [ ] Sistema continua funcionando

---

## 📁 Arquivos Criados

```
distribuited-systems/
├── distributed-orchestrator.js      # Orquestrador + Eleição
├── distributed-rpc.js               # Cliente + Servidor Socket RPC
├── integration-example.js           # Exemplo prático
├── GUIA_AULA.md                    # (Já existia)
└── [seus arquivos anteriores]
```

---

## 💡 Dicas Finais

1. **Teste localmente primeiro** com `node integration-example.js`
2. **RPC tem timeout de 5 segundos** - se a API demorar mais, aumenta no código
3. **Socket.io funciona com proxy** - bom para apresentação em sala
4. **Cada erro de RPC dispara eleição** - automático, não precisa fazer nada
5. **Verifique logs** - procure por `✅`, `❌`, `📤`, `📥`

---

## 🔗 Links de Referência

- **Socket.io Docs**: https://socket.io/docs/
- **Bully Algorithm**: Eleição por ID, O(n²) worst-case
- **gRPC** vs **Socket RPC**: gRPC é mais rápido, Socket é mais flexível

---

## ❓ Perguntas Comuns

**P: E se os colegas não terminarem seu código?**
R: Use o arquivo `integration-example.js` que tem mocks de todos os 3 serviços

**P: Funciona na nuvem?**
R: Sim! Coloque o orquestrador em um servidor (Heroku, AWS, etc) e aponte os serviços pra lá

**P: E se colidir com porta 9000?**
R: Mude em `new RPCOrchestrator(9001)` e nos `.connect('http://localhost:9001')`

**P: Como adicionar um 4º serviço?**
R: Copie o padrão de qualquer um dos 3 com um ID novo e diferente

---

**Última atualização**: 13/03/2026
**Status**: ✅ Pronto para apresentação
