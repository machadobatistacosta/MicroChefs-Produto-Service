/**
 * ALGORITMO RING - Eleição de Líder em Topologia Circular
 * 
 * Processos são organizados em anel. Quando um processo falha,
 * a mensagem de eleição passa de um processo para o próximo
 * até completar o círculo.
 */

const EventEmitter = require('events');

console.log(`
╔═════════════════════════════════════════════════════════════╗
║      ALGORITMO RING - ELEIÇÃO DE LÍDER CIRCULAR             ║
║   Para Sistemas Distribuídos em Topologia de Anel          ║
╚═════════════════════════════════════════════════════════════╝

📚 CONCEITOS DO ALGORITMO RING:

1. TOPOLOGIA EM ANEL
   └─ P1 → P2 → P3 → ... → Pn → P1
   └─ Cada processo tem exatamente 2 vizinhos
   └─ Comunicação unidirecional no anel

2. TIPOS DE MENSAGENS
   ├─ ELECTION: Token que passa no anel
   │  └─ Contém IDs dos processos que participam
   ├─ ELECTED: Anúncio do novo coordenador
   └─ HEARTBEAT: Verificação se coordenador está vivo

3. PROCESSO DE ELEIÇÃO
   ├─ Um processo identifica falha do coordenador
   ├─ Cria mensagem ELECTION com seu ID
   ├─ Passa para o próximo no anel
   ├─ Cada processo adiciona seu ID se está vivo
   ├─ Quando volta ao originador, processo com maior ID vence
   └─ Anúncia novo coordenador: ELECTED

═══════════════════════════════════════════════════════════════
`);

// ========================================
// IMPLEMENTAÇÃO ALGORITMO RING
// ========================================

class RingProcess extends EventEmitter {
  constructor(processId, ringProcesses) {
    super();
    this.id = processId;
    this.allProcesses = ringProcesses;
    this.coordinator = null;
    this.state = 'normal'; // normal, electing, failed
    this.electionInProgress = false;
    this.electionToken = null;
    
    // Encontra próximo processo no anel
    const index = ringProcesses.indexOf(processId);
    this.nextProcess = ringProcesses[(index + 1) % ringProcesses.length];
    this.previousProcess = ringProcesses[(index - 1 + ringProcesses.length) % ringProcesses.length];
  }

  // ========================================
  // MÉTODO: INICIAR ELEIÇÃO
  // ========================================
  initiateElection() {
    if (this.electionInProgress) return;

    console.log(`\n[P${this.id}] 🗳️  INICIANDO ELEIÇÃO NO ANEL`);
    this.electionInProgress = true;

    // Cria token com seu próprio ID
    this.electionToken = {
      initiator: this.id,
      participants: [this.id],
      startTime: Date.now()
    };

    console.log(`[P${this.id}] 📤 Enviando ELECTION para P${this.nextProcess}`);
    this.sendMessage('ELECTION', this.nextProcess, this.electionToken);
  }

  // ========================================
  // MÉTODO: RECEBER MENSAGEM
  // ========================================
  receiveMessage(messageType, senderId, payload) {
    console.log(`[P${this.id}] 📨 Recebeu ${messageType} de P${senderId}`);

    switch (messageType) {
      case 'ELECTION':
        this.handleElectionMessage(senderId, payload);
        break;
      case 'ELECTED':
        this.handleElectedMessage(senderId, payload);
        break;
      case 'HEARTBEAT':
        this.handleHeartbeat(senderId);
        break;
      case 'HEARTBEAT_ACK':
        this.handleHeartbeatAck(senderId);
        break;
    }
  }

  handleElectionMessage(senderId, token) {
    console.log(`[P${this.id}] 💾 Token contém: [${token.participants.join(', ')}]`);

    // Se o iniciador somos nós, eleição completa
    if (token.initiator === this.id) {
      console.log(`[P${this.id}] ✅ ELEIÇÃO COMPLETADA!`);
      this.announceWinner(token);
      return;
    }

    // Adiciona seu ID ao token se está vivo
    if (this.state !== 'failed') {
      token.participants.push(this.id);
      console.log(`[P${this.id}] ➕ Adicionado ao token`);
    }

    // Passa para o próximo no anel
    console.log(`[P${this.id}] 📤 Passando ELECTION para P${this.nextProcess}`);
    this.sendMessage('ELECTION', this.nextProcess, token);
  }

  announceWinner(token) {
    // Encontra processo com maior ID
    const winner = Math.max(...token.participants);
    console.log(`[P${this.id}] 👑 VENCEDOR: P${winner}`);

    // Cria mensagem de eleito
    const electedMsg = {
      coordinator: winner,
      allParticipants: token.participants,
      electionTime: Date.now() - token.startTime
    };

    // Envia ELECTED para todos no anel
    console.log(`[P${this.id}] 📢 Anunciando novo coordenador...`);
    this.elected(winner, electedMsg);

    // Passa mensagem ELECTED no anel
    this.sendMessage('ELECTED', this.nextProcess, electedMsg);
  }

  handleElectedMessage(senderId, payload) {
    const winner = payload.coordinator;

    console.log(`[P${this.id}] 👑 NOVO COORDENADOR ELEITO: P${winner}`);
    this.coordinator = winner;
    this.electionInProgress = false;
    this.state = 'normal';

    // Se não somos o último na cadeia, passa adiante
    if (senderId !== this.id) {
      console.log(`[P${this.id}] 📤 Repassando ELECTED para P${this.nextProcess}`);
      this.sendMessage('ELECTED', this.nextProcess, payload);
    }
  }

  handleHeartbeat(senderId) {
    if (this.state !== 'failed') {
      console.log(`[P${this.id}] 💓 Respondendo heartbeat`);
      this.sendMessage('HEARTBEAT_ACK', senderId, {});
    }
  }

  handleHeartbeatAck(senderId) {
    console.log(`[P${this.id}] 🏥 Coordenador P${senderId} está vivo`);
  }

  // ========================================
  // MÉTODO: ENVIAR MENSAGEM (simulado)
  // ========================================
  sendMessage(messageType, targetId, payload) {
    this.emit('message', {
      from: this.id,
      to: targetId,
      type: messageType,
      payload: payload || {},
      timestamp: new Date().toISOString()
    });
  }

  elected(coordinatorId, payload) {
    console.log(`[P${this.id}] ⭐ Eleito: P${coordinatorId}`);
    this.coordinator = coordinatorId;
  }

  // ========================================
  // MÉTODO: SIMULAR FALHA
  // ========================================
  fail() {
    console.log(`\n⚠️  [P${this.id}] FALHOU!`);
    this.state = 'failed';
  }

  // ========================================
  // MÉTODO: RECUPERAR DE FALHA
  // ========================================
  recover() {
    console.log(`\n✅ [P${this.id}] RECUPERADO!`);
    this.state = 'normal';
  }

  // ========================================
  // MÉTODO: VERIFICAR COORDENADOR
  // ========================================
  checkCoordinator() {
    if (this.coordinator === null) {
      console.log(`[P${this.id}] ⚠️  Coordenador desconhecido! Iniciando eleição`);
      this.initiateElection();
    } else if (this.state !== 'failed') {
      this.sendMessage('HEARTBEAT', this.coordinator, {});
    }
  }

  getStatus() {
    return {
      processId: this.id,
      coordinator: this.coordinator,
      state: this.state,
      electionInProgress: this.electionInProgress,
      nextProcess: this.nextProcess,
      previousProcess: this.previousProcess
    };
  }
}

// ========================================
// SIMULAÇÃO DO SISTEMA RING
// ========================================

class RingElectionSystem {
  constructor(processIds) {
    this.processes = new Map();
    this.messageLog = [];
    this.sortedIds = processIds.sort((a, b) => a - b);

    // Cria processos em anel
    this.sortedIds.forEach(id => {
      this.processes.set(id, new RingProcess(id, this.sortedIds));
      
      // Listener para mensagens
      this.processes.get(id).on('message', (msg) => {
        this.messageLog.push(msg);
        this.deliverMessage(msg);
      });
    });

    // Define coordenador inicial (maior ID)
    const initialCoordinator = Math.max(...processIds);
    this.processes.get(initialCoordinator).coordinator = initialCoordinator;
  }

  deliverMessage(msg) {
    const targetProcess = this.processes.get(msg.to);
    if (targetProcess && targetProcess.state !== 'failed') {
      targetProcess.receiveMessage(msg.type, msg.from, msg.payload);
    }
  }

  simulateCoordinatorFailure(targetId) {
    const process = this.processes.get(targetId);
    if (process) {
      process.fail();
      
      // Próximo processo no anel detecta falha
      setTimeout(() => {
        const nextId = this.sortedIds[(this.sortedIds.indexOf(targetId) + 1) % this.sortedIds.length];
        const nextProcess = this.processes.get(nextId);
        
        if (nextProcess && nextProcess.state !== 'failed') {
          console.log(`\n[P${nextId}] 🔔 Detectou falha de P${targetId}`);
          nextProcess.initiateElection();
        }
      }, 500);
    }
  }

  recoverProcess(processId) {
    const process = this.processes.get(processId);
    if (process) {
      process.recover();
    }
  }

  printTopology() {
    console.log('\n🔄 TOPOLOGIA DO ANEL:');
    console.log('====================');
    const arrow = ' → ';
    const ring = this.sortedIds.map(id => {
      const proc = this.processes.get(id);
      const icon = proc.state === 'failed' ? '❌' : '✅';
      return `P${id}${icon}`;
    }).join(arrow);
    console.log(ring + arrow + 'P' + this.sortedIds[0]);
  }

  getStatus() {
    const status = {};
    this.processes.forEach((proc, id) => {
      status[`P${id}`] = proc.getStatus();
    });
    return status;
  }

  printStatus() {
    console.log('\n📊 STATUS DO SISTEMA:');
    console.log('========================');
    this.processes.forEach((proc) => {
      const status = proc.getStatus();
      const icon = status.state === 'failed' ? '❌' : status.state === 'electing' ? '🗳️ ' : '✅';
      console.log(`${icon} P${status.processId}: Coord=P${status.coordinator}, Próx=P${status.nextProcess}`);
    });
  }
}

// ========================================
// EXEMPLO DE EXECUÇÃO
// ========================================

console.log(`

📊 FLUXO DO ALGORITMO RING:

CENÁRIO 1: Falha do Coordenador
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Topologia: P1 → P3 → P5 → P1

Inicial:
  P1: Coord = P5
  P3: Coord = P5
  P5: Coord = P5 (Coordenador)

Passo 1: P5 FALHA
  P1: Coord = P5 (?)
  P3: Coord = P5 (?)
  P5: ❌ FALHOU

Passo 2: P1 inicia eleição
  P1 cria token: [1]
  P1 → P3 com ELECTION

Passo 3: P3 recebe token
  Token = [1, 3]
  P3 → P5 com ELECTION

Passo 4: P5 está falho
  Mensagem não entrega a P5
  P5 → P1 (próximo, P5 pula)

Passo 5: P1 recebe seu próprio token de volta
  Token final = [1, 3]
  Maior ID = 3
  P1 anuncia P3 como novo coordenador

Resultado: P3 é novo coordenador

═══════════════════════════════════════════════════════════════

COMPARAÇÃO: RING vs BULLY

┌─────────────────┬──────────────────────┬──────────────────────┐
│ Aspecto         │ BULLY                │ RING                 │
├─────────────────┼──────────────────────┼──────────────────────┤
│ Topologia       │ Qualquer             │ Circular/Anel        │
│ Mensagens       │ O(n²) worst case     │ O(n²) sempre         │
│ Complexidade    │ Simples              │ Média                │
│ Escalabilidade  │ Baixa                │ Média                │
│ Assumiu vivos   │ Todos conhecidos     │ Conhece vizinhos     │
└─────────────────┴──────────────────────┴──────────────────────┘

═══════════════════════════════════════════════════════════════

✅ VANTAGENS ALGORITHM RING:

✓ Funciona bem em topologia circular
✓ Menos mensagens que Bully em alguns casos
✓ Mais escalável que Bully

❌ DESVANTAGENS:

✗ Requer topologia específica
✗ Ainda O(n²) no pior caso
✗ Detecta falhas lentamente

═══════════════════════════════════════════════════════════════
`);

module.exports = { RingProcess, RingElectionSystem };

console.log('\n✓ Módulo Algoritmo Ring carregado com sucesso!');
