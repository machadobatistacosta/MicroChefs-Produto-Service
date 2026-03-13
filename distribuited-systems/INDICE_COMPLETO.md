# 📋 ÍNDICE COMPLETO - Sistema Distribuído do Grupo

Você agora tem uma **arquitetura distribuída completa** com:
- ✅ Socket RPC entre 3 microserviços
- ✅ Eleição de Líder (Bully)
- ✅ Failover automático
- ✅ Documentação e exemplos

---

## 📁 Arquivos Criados (Novos)

### 1. **distributed-rpc.js** (📝 Principal)
- **O quê**: Servidor orquestrador + Cliente RPC
- **Usa**: Socket.io para comunicação bidirecional
- **Portas**: 9000 (orquestrador)
- **Quando rodar**: Sempre primeiro
- **Comando**: `node distributed-rpc.js`

```
┌─ RPCOrchestrator
│  └─ Porta 9000
│  └─ Descobre serviços automaticamente
│  └─ Roteia chamadas RPC
│  └─ Gerencia eleição
│
└─ DistributedRPCClient
   └─ Conecta cada microserviço
   └─ Registra endpoints
   └─ Chama outros serviços
```

---

### 2. **distributed-orchestrator.js** (📖 Referência)
- **O quê**: Orquestrador em memória (alternativa mais simples)
- **Usa**: EventEmitter, sem Socket.io
- **Quando usar**: Para entender o conceito primeiro
- **Comando**: `node distributed-orchestrator.js`

---

### 3. **adapter-produtos.js** (⭐ Seu Código)
- **O quê**: Seu microserviço PRODUTOS integrado com RPC
- **Modificações em relação ao seu código**: + RPC client
- **Portas**: 3002 (sua API normal) + conexão ao 9000
- **Endpoints RPC**: 6 métodos registrados
  - `listar_produtos` - Lista todos
  - `obter_produto` - Get por ID
  - `verificar_estoque` - Verifica disponibilidade
  - `criar_produto` - Cria novo
  - `atualizar_produto` - Atualiza
  - `deletar_produto` - Remove
- **Comando**: `node adapter-produtos.js`

```
Rotas Express (normais):
GET  /api/produtos              (listar local)
GET  /api/produtos/:id          (obter local)
POST /api/produtos              (criar local)
PUT  /api/produtos/:id          (atualizar local)
DELETE /api/produtos/:id        (deletar local)
GET  /api/status                (ver status RPC)
POST /api/pedidos/novo          (usar RPC para criar pedido)

Endpoints RPC (para outros chamarem):
+ 6 métodos acima como RPC
```

---

### 4. **integration-example.js** (🧪 Testes)
- **O quê**: Simula os 3 microserviços com mocks
- **Usa**: Orquestrador + 3 clientes RPC
- **Quando usar**: Para testar o fluxo sem colegas
- **Cenários demai**:
  1. Listar produtos
  2. Validar cliente
  3. Cross-service RPC
  4. Fluxo completo de pedido
  5. Failover de serviço
- **Comando**: `node integration-example.js`

---

### 5. **exemplo-testes.js** (🧪 HTTP Tests)
- **O quê**: Testes HTTP contra a API
- **Usa**: GET/POST/PUT/DELETE em http://localhost:3002
- **7 cenários**: Todos os endpoints
- **Saída**: Como deve parecer cada resposta
- **Dica**: Use também com curl/Postman
- **Comando**: `node exemplo-testes.js`

---

### 6. **GUIA_INTEGRACAO.md** (📖 Passo a Passo)
- **O quê**: Como integrar com código dos colegas
- **Inclui**: 
  - Passo 1: Adicionar RPC ao seu app.js
  - Passo 2: Usar RPC nas rotas
  - Passo 3: Instruções para colega 1 (CLIENTES)
  - Passo 4: Instruções para colega 2 (PEDIDOS)
  - Checklist de implementação
- **Público**: Leia antes de apresentar

---

### 7. **ARQUITETURA_COMPLETA.md** (📖 Visão Geral)
- **O quê**: Documentação completa do projeto
- **Inclui**:
  - Roteiros de execução (solo, com API real, com grupo)
  - Fluxograma de comunicação
  - Eleição de líder visual
  - Checklist pré-apresentação
  - FAQ
  - Próximas ideias
- **Público**: Leia para entender tudo

---

## 🚀 Como Começar

### Opção A: Teste Rápido (5 min) ⚡

```bash
# Terminal 1
cd c:\Users\cmbcosta\Desktop\ds\distribuited-systems
node distributed-rpc.js

# Terminal 2  
node integration-example.js

# ✅ Vê os 3 serviços falando entre si automaticamente
```

---

### Opção B: Com Sua API (10 min)

```bash
# Terminal 1
node distributed-rpc.js

# Terminal 2
node adapter-produtos.js

# Terminal 3
node exemplo-testes.js

# ✅ Testa sua API com RPC integrado
```

---

### Opção C: Com Colega (20 min)

```bash
# Terminal 1
node distributed-rpc.js

# Terminal 2
node adapter-produtos.js

# Terminal 3
cd [seu_colega_1_pasta]
node app.js  # (com RPC integrado)

# Terminal 4
cd [seu_colega_2_pasta]
node app.js  # (com RPC integrado)

# Terminal 5
node exemplo-testes.js

# ✅ Vê o fluxo de pedido completo com 3 serviços reais
```

---

## 📊 Mapa de Arquivos vs Uso

```
┌─────────────────────────────────────────────────────────────┐
│                  Seu Projeto                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  distribuited-systems/                                     │
│  ├─ distributed-rpc.js          ◄─────┐                  │
│  │                                    │ RODE PRIMEIRO    │
│  ├─ distributed-orchestrator.js  ◄─ Alternativa (opcional)│
│  │                                    │                   │
│  ├─ adapter-produtos.js          ◄─ RODE SEGUNDO          │
│  │  └─ Integra com suas rotas       │ (sua API)           │
│  │                                    │                    │
│  ├─ integration-example.js        ◄─ RODE TERCEIRO       │
│  │  └─ Simula 3 serviços           │ (OU com colegas)    │
│  │                                    │                    │
│  ├─ exemplo-testes.js            ◄─ RODE ÚLTIMO         │
│  │  └─ Testa HTTP                   │ (validação)        │
│  │                                    │                    │
│  ├─ GUIA_INTEGRACAO.md           ◄─ LEIA ANTES      │
│  │  └─ Como fazer colegas           │ de integrar        │
│  │                                    │                    │
│  ├─ ARQUITETURA_COMPLETA.md      ◄─ LEIA PARA APRENDER │
│  │  └─ Visão geral completa          │ (apresentação)    │
│  │                                    │                    │
│  └─ [arquivos anteriores]        ◄─ Mantém como estava   │
│     ├─ bully-algorithm.js            │                    │
│     ├─ ring-algorithm.js             │                    │
│     ├─ grpc-example.js               │                    │
│     ├─ rpc-socket-example.js         │                    │
│     ├─ test-election-algorithms.js   │                    │
│     ├─ GUIA_AULA.md                  │                    │
│     └─ README.md                     │                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist Antes da Apresentação

- [ ] `node distributed-rpc.js` roda sem erros
- [ ] `node adapter-produtos.js` roda e conecta ao orquestrador
- [ ] `node exemplo-testes.js` passa os 7 testes
- [ ] `node integration-example.js` mostra fluxo completo
- [ ] GET `http://localhost:3002/api/status` mostra RPC conectado
- [ ] POST `http://localhost:3002/api/pedidos/novo` usa RPC
- [ ] Colegas têm `distributed-rpc.js` no seu projeto
- [ ] Você tem instruções para eles em `GUIA_INTEGRACAO.md`
- [ ] Slides prontos explicando arquitetura
- [ ] Código documentado e comments claros

---

## 🔍 Estrutura de Portas

```
┌──────────────────────────────────────────────┐
│             MAPEAMENTO DE PORTAS              │
├────────────┬──────────────┬──────────────────┤
│ Serviço    │ Porta        │ Tipo             │
├────────────┼──────────────┼──────────────────┤
│ Orques.    │ 9000         │ Socket.io Server │
│ Produtos   │ 3002         │ Express API      │
│ Clientes   │ 3003         │ Express API      │
│ Pedidos    │ 3004         │ Express API      │
├────────────┴──────────────┴──────────────────┤
│ TODAS conectam ao Orques. (9000) via Socket │
└──────────────────────────────────────────────┘
```

---

## 📚 Para Estudar Antes de Apresentar

1. **Socket.io Basics** (5 min)
   - emit/on (enviar/receber)
   - conectar/desconectar
   - fallback automático

2. **RPC Concept** (5 min)
   - Request/Response com timeouts
   - Cross-service calls
   - Error handling

3. **Bully Algorithm** (10 min)
   - Por ID será eleito
   - Como funciona eleição
   - Caso de falha

4. **Seu Código** (10 min)
   - Como endpoints RPC são registrados
   - Como outros serviços os chamam
   - Fluxo de novo pedido

---

## 💬 Script de Apresentação (3 minutos)

```
"Desenvolvemos um sistema distribuído com 3 microserviços
que se comunicam via RPC sobre Socket.io.

[Mostrar diagram no ARQUITETURA_COMPLETA.md]

Cada serviço pode:
1. Ser chamado remotamente (endpoints RPC)
2. Chamar outro serviço (RPC client)
3. Descobrir automaticamente novos serviços
4. Eleger um líder quando um cai (Bully alg.)

Quando um cliente faz novo pedido:
1. PEDIDOS valida cliente (RPC para CLIENTES)
2. PEDIDOS valida produtos (RPC para PRODUTOS)
3. Sistema cria o pedido
4. Se PRODUTOS cai, novo líder é eleito
5. Sistema continua funcionando

Socket.io garante:
- Funciona em WebSocket (rápido)
- Fallback para HTTP Polling (confiável)
- Funciona em qualquer rede (mesmo com proxy)

Demo ao vivo: [rode integration-example.js]
"
```

---

## ❌ Erros Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| `Cannot find module 'socket.io'` | Não instalou | `npm install socket.io socket.io-client` |
| `Port 9000 already in use` | Orq. ja rodando | Mude porta ou `lsof -i :9000` + kill |
| `Cannot find module 'distributed-rpc'` | Caminho errado | Tem `distributed-rpc.js` em `distribuited-systems/`? |
| `RPC timeout` | Serviço não respondeu | Ser. não foi registrado? Orq. não rodando? |
| `Cannot connect to localhost:3002` | API não rodando | `node adapter-produtos.js` no outro terminal |

---

## 🎓 O Que Você Aprendeu

```
┌──────────────┐
│ Antes        │ Depois
├──────────────┼─────────────────────────────────┐
│              │                                │
│ Express      │ Express + Socket RPC           │
│ MongoDB      │ MongoDB + Orquestrador         │
│ 1 API        │ 3 APIs falando entre si        │
│ Sem falha    │ Failover automático            │
│ Manual       │ Eleição de líder automática    │
│              │                                │
└──────────────┴─────────────────────────────────┘
```

---

## 🚀 Próximos Passos (Depois da Apresentação)

Se quiser ainda ir além:

1. **Deploy na nuvem**
   - Heroku, AWS, Azure
   - Orquestrador em servidor
   - APIs em diferentes máquinas

2. **Raft Algorithm** (mais robusto)
   - Ao invés de Bully
   - Log replication
   - Consenso verificado

3. **gRPC Real**
   - Protocol Buffers
   - HTTP/2
   - Performance máxima

4. **Docker**
   - Container cada serviço
   - docker-compose
   - Fácil deploy

5. **Banco de Dados Distribuído**
   - Replicação entre instâncias
   - Quórum writing
   - Eventual consistency

---

## 📞 Comunicar com Colegas

Envie isto:

> Opa! Preciso integrar RPC ao seu serviço.
>
> 1. Copie `distributed-rpc.js` para sua pasta
> 2. Execute `npm install socket.io socket.io-client`
> 3. Adicione isto ao final do seu `app.js`:
>
> ```javascript
> const { DistributedRPCClient } = require('./distributed-rpc');
> const rpcClient = new DistributedRPCClient('[CLIENTES|PEDIDOS]', [3003|3004], [2|1]);
> 
> // Registre seus métodos:
> rpcClient.registerEndpoint('seu_metodo', async (params) => {
>   // sua lógica
>   return { sucesso: true, dados: [...] };
> });
> 
> await rpcClient.connect('http://localhost:9000');
> ```
>
> 4. Export para meu código:
> ```javascript
> module.exports = { app, rpcClient };
> ```
>
> Leia GUIA_INTEGRACAO.md para exemplos completos!

---

## ✅ Status Final

```
┌─────────────────────────────────────────┐
│       PROJETO DISTRIBUÍDO COMPLETO      │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Código pronto                       │
│  ✅ Documentação completa                │
│  ✅ Exemplos funcionais                  │
│  ✅ Testes integrados                    │
│  ✅ Pronto para apresentação             │
│  ✅ Escalável (adicione 4º serviço fácil)│
│                                         │
│  Próximo: Execute e apresente!          │
│                                         │
└─────────────────────────────────────────┘
```

---

**Última atualização:** 13/03/2026  
**Versão:** 2.0 (com RPC + Orquestrador)  
**Status:** ✅ PRONTO PARA APRESENTAÇÃO  

Bora apresentar esse projeto incrível! 🚀
