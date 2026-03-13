# 🎯 Arquitetura Distribuída Completa para o Trabalho de Grupo

## 📚 Visão Geral da Solução

Você está criando um **Sistema de Pedidos Distribuído** com 3 microserviços que se comunicam via **Socket RPC** com **Eleição de Líder Automática (Bully)**.

```
┌─────────────────────────────────────────────────────────────┐
│                   SUA APRESENTAÇÃO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "Sistema distribuído para gestão de pedidos com RPC"     │
│                                                             │
│  ✅ Comunicação entre serviços via Socket.io              │
│  ✅ 4 exemplos de RPC (Unário, Streaming, bidirecional)  │
│  ✅ Eleição de líder automática (Bully algorithm)         │
│  ✅ Failover e redundância                                │
│  ✅ Fallback automático para Polling (se WebSocket fechar)│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estrutura de Arquivos Criados

```
distribuited-systems/
│
├── 📄 distributed-orchestrator.js
│   └─ Orquestrador central com eleição de líder
│      Instantia os 3 serviços e gerencia falhas
│
├── 📡 distributed-rpc.js
│   ├─ RPCOrchestrator: Servidor Socket (porta 9000)
│   └─ DistributedRPCClient: Cliente para cada serviço
│      Comunicação bidirecional com timeout
│
├── 🏭 adapter-produtos.js
│   └─ SUA API integrada com RPC
│      • Express normal em :3002
│      • Pode ser CHAMADA via RPC por outros
│      • Pode CHAMAR outros serviços
│
├── 🧪 integration-example.js
│   └─ Exemplo completo com mocks dos 3 serviços
│      Demonstra fluxo de novo pedido
│      Simula falhas e eleição
│
├── 📖 GUIA_INTEGRACAO.md
│   └─ Passo a passo para integrar com colegas
│      Como adicionar RPC ao código deles
│      Testes e validação
│
├── 📋 GUIA_AULA.md (anterior)
│   └─ Referência gRPC + Bully + Ring
│
└── 📜 README.md (anterior)
    └─ Visão geral dos algoritmos
```

---

## 🚀 Roteiros de Execução

### ROTEIRO 1: Teste Solo (com mocks integrados)

```bash
# Terminal 1: Orquestrador
cd c:\Users\cmbcosta\Desktop\ds\distribuited-systems
node distributed-rpc.js

# Terminal 2: Simulação integrada (tem mocks dos 3)
node integration-example.js

# Esperado:
# ✅ [Produtos] Conectado
# ✅ [Clientes] Conectado
# ✅ [Pedidos] Conectado
# [Vários testes rodam automaticamente]
# ✨ FLUXO COMPLETO EXECUTADO COM SUCESSO!
```

---

### ROTEIRO 2: Teste com Sua API Real

```bash
# Terminal 1: Orquestrador
cd c:\Users\cmbcosta\Desktop\ds\distribuited-systems
node distributed-rpc.js

# Terminal 2: Sua API com RPC integrada
node adapter-produtos.js

# Terminal 3: Teste HTTP (curl, Postman, etc)
GET  http://localhost:3002/api/produtos
POST http://localhost:3002/api/status
```

---

### ROTEIRO 3: Com os 3 Serviços Reais do Grupo

```bash
# Terminal 1: Orquestrador
cd c:\Users\cmbcosta\Desktop\ds\distribuited-systems
node distributed-rpc.js

# Terminal 2: PRODUTOS (seu código)
cd c:\Users\cmbcosta\Desktop\ds\product-microservice
node adapter-produtos.js

# Terminal 3: CLIENTES (do colega 1 - com RPC integrado)
cd [seu_colega_1]/...
node app.js  # (modificado com RPC)

# Terminal 4: PEDIDOS (do colega 2 - com RPC integrado)
cd [seu_colega_2]/...
node app.js  # (modificado com RPC)

# Terminal 5: Testes
node integration-example.js  # ou testes Postman
```

---

## 🔧 Arquivos para Entregar ao Grupo

### Para Colega 1 (CLIENTES)

Envie este trecho para adicionar ao `src/app.js`:

```javascript
const { DistributedRPCClient } = require('../distributed-rpc');

const rpcClient = new DistributedRPCClient('Clientes', 3003, 2);

// Registrar suas funções como endpoints RPC
rpcClient.registerEndpoint('buscar', async (params) => {
  const cliente = await Cliente.findById(params.id);
  return { sucesso: true, cliente };
});

rpcClient.registerEndpoint('validar_cpf', async (params) => {
  // sua lógica
  return { sucesso: true, valido: true };
});

rpcClient.registerEndpoint('criar', async (params) => {
  const novo = await Cliente.create(params);
  return { sucesso: true, cliente: novo };
});

await rpcClient.connect('http://localhost:9000');
module.exports = { app, rpcClient };
```

### Para Colega 2 (PEDIDOS)

Envie este trecho para adicionar ao `src/app.js`:

```javascript
const { DistributedRPCClient } = require('../distributed-rpc');

const rpcClient = new DistributedRPCClient('Pedidos', 3004, 1);

rpcClient.registerEndpoint('criar', async (params) => {
  // Validar cliente
  const cliente = await rpcClient.callRemote('Clientes', 'buscar', {
    id: params.clienteId
  });
  if (!cliente.cliente) throw new Error('Cliente inválido');

  // Validar produtos
  for (let id of params.produtosIds) {
    const prod = await rpcClient.callRemote('Produtos', 'obter_produto', {
      id: id
    });
    if (!prod.produto) throw new Error('Produto inválido');
  }

  // Criar pedido
  const novo = await Pedido.create(params);
  return { sucesso: true, pedido: novo };
});

await rpcClient.connect('http://localhost:9000');
module.exports = { app, rpcClient };
```

---

## 📊 Fluxos de Comunicação

### Fluxo 1: Listar Produtos (RPC Simples)

```
Cliente/Postman
      │
      │ GET /api/produtos
      ▼
┌─────────────────────────┐
│ Produtos (3002)         │
│                         │
│ GET /api/produtos       │
│   └─ Query MongoDB      │
│   └─ Retorna JSON       │
└─────────────────────────┘
      │
      │ JSON
      ▼
Cliente/Postman
```

---

### Fluxo 2: Criar Pedido (RPC Multi-serviço)

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente HTTP (Postman)                                      │
│ POST /api/pedidos/novo                                      │
│ { clienteId: "c1", produtosIds: ["p1", "p2"] }            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────────────┐
                │ Produtos (3002)         │
                │                         │
                │ 1. Validar cliente      │
                │    └─ RPC to Clientes   ├─────────────────────────┐
                │                         │                         │
                │ 2. Verificar estoque    │                         │
                │    └─ Busca local       │                         │
                │                         │                         │
                │ 3. Criar pedido         │                         │
                │    └─ RPC to Pedidos    ├─────────────────────────┤
                └─────────────────────────┘                         │
                                                                    ▼
                                            ┌─────────────────────────────────┐
                                            │ Orquestrador (9000)             │
                                            │                                 │
                                            │ Roteia RPCs entre serviços      │
                                            │ Gerencia descoberta e eleição    │
                                            │                                 │
                                            └─────────────────────────────────┘
                                                    │           │           │
                                        ┌───────────┴─────┬─────┴──────┐
                                        │                 │            │
                                        ▼                 ▼            ▼
                              ┌──────────────────┐  ┌──────────────┐ ┌────────────┐
                              │ Clientes (3003)  │  │Produtos(3002)│ │Pedidos(3004)│
                              │                  │  │              │ │             │
                              │ buscar cliente   │  │ verificar    │ │ criar       │
                              └──────────────────┘  │ estoque      │ │ pedido      │
                                                   │              │ │             │
                                                   └──────────────┘ └────────────┘
```

---

### Fluxo 3: Eleição de Líder (quando serviço cai)

```
ANTES:                      EVENTO:                DEPOIS:
┌────────────┐             ⚠️ FALHA              ┌────────────┐
│ Produtos   │             de Produtos           │ Produtos   │
│ (ID=3)     │             ❌                    │ (ID=3)     │
│ LÍDER      │  ───────►   Detecção              │ CAÍDO      │
└────────────┘             automática             └────────────┘
┌────────────┐             pelo Orq.              ┌────────────┐
│ Clientes   │                                    │ Clientes   │
│ (ID=2)     │             Iniciar                │ (ID=2)     │
│ FOLHA      │  ───────►   eleição (Bully)  ──► │ LÍDER      │⬅️ NOVA!
└────────────┘             O(n²) algoritmo        └────────────┘
┌────────────┐                                    ┌────────────┐
│ Pedidos    │                                    │ Pedidos    │
│ (ID=1)     │             Resultado:             │ (ID=1)     │
│ FOLHA      │  ───────►   Maior ID vence   ──► │ FOLHA      │
└────────────┘             (Clientes = 2)         └────────────┘
```

---

## 📊 Resumo de Tipos de Comunicação

```
┌──────────────────────────────────────┐
│ TIPOS DE RPC IMPLEMENTADOS           │
├──────────────────────────────────────┤
│                                      │
│ 1. UNÁRIO (1 req → 1 resp)          │
│    callRemote('Clientes', 'buscar') │
│                                      │
│ 2. SERVER-STREAMING (1 req → N resp)│
│    (simulado com array na resposta)  │
│                                      │
│ 3. CLIENT-STREAMING (N req → 1 resp)│
│    (múltiplas chamadas, 1 resposta)  │
│                                      │
│ 4. BIDIRECIONAL (N req ↔ N resp)    │
│    (Socket permite full-duplex)      │
│                                      │
└──────────────────────────────────────┘
```

---

## 🔑 Características Principais

### ✅ Comunicação (Socket RPC)
- **Bidirecional**: Qualquer serviço pode chamar qualquer outro
- **Fallback automático**: WebSocket → HTTP Polling
- **Timeout**: 5 segundos padrão (configurável)
- **Descoberta automática**: Cada novo serviço é descoberto

### ✅ Eleição de Líder (Bully)
- **Critério**: Maior ID entre serviços saudáveis
- **Automática**: Dispara quando um cai
- **O(n²)**: Worst-case (aceitável para ≤10 serviços)
- **Estados**: Normal, Electing, Failed

### ✅ Failover e Recuperação
- **Detecção**: Via heartbeat/timeout
- **Reeleição**: Imediata quando líder cai
- **Quórum**: Não precisa (simples maioria)
- **Split-brain**: Evitado por ID determinístico

---

## 🎯 Para Apresentar em Aula

### Slide 1: Problema
```
"Como fazer 3 microserviços se comunicarem
 de forma confiável e automática?"
```

### Slide 2: Solução
```
Socket RPC: Fácil integração, fallback automático
Bully: Eleição simples, determinística
```

### Slide 3: Demonstração Ao Vivo
```
1. Iniciar os 3 serviços
2. Ver descoberta automática
3. Lançar um pedido (vê multiplas RPCs)
4. Desconectar Produtos
5. Ver eleição automática
6. Sistema continua funcionando
```

### Slide 4: Vantagens
```
✅ Escalável (add 4º, 5º serviço fácil)
✅ Resiliente (continua se um cai)
✅ Automático (sem config manual)
✅ Real-time (Socket.io)
✅ Fallback (WebSocket + Polling)
```

---

## 📋 Checklist de Implementação

Antes de apresentar, certifique-se:

- [ ] Orquestrador rodando (porta 9000)
- [ ] PRODUTOS registrado com 6+ endpoints RPC
- [ ] CLIENTES registrado com 3+ endpoints RPC
- [ ] PEDIDOS registrado com 4+ endpoints RPC
- [ ] Fluxo de novo pedido funciona end-to-end
- [ ] Eleição funciona quando desconecta um
- [ ] Fallback funciona (teste com firewall/proxy)
- [ ] Logs mostram claramente o que está acontecendo
- [ ] Documentação estar pronta

---

## 💻 Dependências

```bash
npm install express socket.io socket.io-client
```

Adicione ao `package.json` de cada serviço:
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.5.0",
    "socket.io-client": "^4.5.0"
  }
}
```

---

## 📞 Contato COM COLEGAS

Mande mensagem assim:

> Opa! Você precisa integrar RPC ao seu serviço.
> 
> 1. Copie `distributed-rpc.js` para seu projeto
> 2. Adicione este código no seu `app.js`:
> [cole o código do Colega 1 ou 2 acima]
> 3. Rode com `node app.js`
> 4. Seu serviço estará descoberto automaticamente!
> 
> Se o orquestrador (9000) cair, seu código continua funcionando local.
> Quando voltar, reconecta automaticamente.

---

## 🎓 O Que Você Aprendeu

| Conceito | Implementação | Benefício |
|----------|---------------| ----------|
| **RPC** | Socket.io com request/response | Chamadas síncronas entre processos |
| **Descoberta de Serviços** | Registro automático via Socket | Sem DNS/config manual |
| **Eleição de Líder** | Bully algorithm | Failover automático |
| **Fallback** | WebSocket + Polling | Funciona em qualquer rede |
| **Timeout** | 5s com promise reject | Evita deadlocks |
| **Broadcast** | Socket.emit | Notificações para todos |

---

## 🚀 Próximas Ideias (Opcional)

Se quiser ir além:

1. **Implementar Raft** (mais robusto que Bully)
2. **Adicionar persistência** (salvar estado do líder)
3. **Replicação de dados** (Líder replica para replicas)
4. **gRPC real** (Protocol Buffers + HTTP/2 para performance)
5. **Containerizar** com Docker + docker-compose
6. **Deploy na nuvem** (Heroku, AWS, Azure)

---

## ❓ FAQ

**P: E se porta 9000 tiver em uso?**
R: Mude em `new RPCOrchestrator(9001)` e todos os `.connect('localhost:9001')`

**P: Funciona entre máquinas diferentes?**
R: Sim! Coloque orquestrador em um IP público, aponte serviços pra lá

**P: Perde mensagens se desconectar?**
R: Sim, reconecta mas não retenta. Para produção use RabbitMQ/Kafka

**P: Quantos serviços suporta?**
R: Até ~10 sem problemas. Acima disso, considere Raft/Zookeeper

**P: Funciona em tempo real?**
R: Sim! Socket.io é real-time, tens <100ms de latência local

---

## 📄 Licença e Créditos

Desenvolvido para **Aula de Sistemas Distribuídos**
Todos os arquivos estão prontos para apresentação
Sinta-se livre adaptar conforme necessário

---

**Última atualização:** 13/03/2026  
**Status:** ✅ PRONTO PARA APRESENTAÇÃO  
**Próximo passo:** Execute `node distributed-rpc.js` + `node adapter-produtos.js`
