/**
 * ALGORITMO BULLY - Eleição de Líder em Sistemas Distribuídos
 * 
 * Um processo inicia eleição se detecta que o coordenador (líder) falhou.
 * O processo com ID mais alto se torna o novo líder.
 */

const EventEmitter = require('events');

console.log(`
╔═════════════════════════════════════════════════════════════╗
║      ALGORITMO BULLY - ELEIÇÃO DE LÍDER DISTRIBUÍDA        ║
║   Em Sistemas Distribuídos para Tolerância a Falhas        ║
╚═════════════════════════════════════════════════════════════╝

📚 CONCEITOS DO ALGORITMO BULLY:

1. ELEIÇÃO DE LÍDER
   └─ Cada processo tem um ID único
   └─ O processo com maior ID é o líder
   └─ Se líder falha, inicia-se eleição

2. TIPOS DE MENSAGENS
   ├─ ELECTION: "Candidato para líder"
   ├─ OK: "Reconheço que você pode ser candidato"
   └─ COORDINATOR: "Eu sou o novo coordenador"

3. REGRAS DO ALGORITMO
   ├─ Se processo P falha, outro inicia eleição
   ├─ Processo envia ELECTION para todos com ID > seu ID
   ├─ Se recebe OK, desiste (tem competidor maior)
   ├─ Se ninguém responde, ele se torna coordenador
   └─ Coordenador avisa todos: "Eu sou o novo líder"

═══════════════════════════════════════════════════════════════
`);

// ========================================
// IMPLEMENTAÇÃO ALGORITMO BULLY
// ========================================

class Process extends EventEmitter {
  constructor(processId, processIdList) {
    super();
    this.id = processId;
    this.allProcesses = processIdList;
    this.coordinator = null;
    this.state = 'normal'; // normal, electing, failed
    this.inElection = false;
    this.receivedOk = false;
  }

  // ========================================
  // MÉTODO: INICIAR ELEIÇÃO
  // ========================================
  initiateElection() {
    console.log(`\n[P${this.id}] 🗳️  INICIANDO ELEIÇÃO`);
    this.state = 'electing';
    this.inElection = true;
    this.receivedOk = false;

    const higherProcesses = this.allProcesses.filter(id => id > this.id);

    // Se não há processo com ID maior
    if (higherProcesses.length === 0) {
      console.log(`[P${this.id}] 👑 NÃO HÁ PROCESSO COM ID MAIOR!`);
      this.becomeCoordinator();
      return;
    }

    // Envia ELECTION para todos com ID maior
    console.log(`[P${this.id}] 📤 Enviando ELECTION para processos: ${higherProcesses.join(', ')}`);
    
    higherProcesses.forEach(processId => {
      this.sendMessage('ELECTION', processId);
    });

    // Aguarda respostas (timeout 3s)
    const timeout = setTimeout(() => {
      if (!this.receivedOk) {
        console.log(`[P${this.id}] ✅ NENHUMA RESPOSTA RECEBIDA`);
        this.becomeCoordinator();
      }
      this.inElection = false;
    }, 3000);
  }

  // ========================================
  // MÉTODO: RECEBER MENSAGEM
  // ========================================
  receiveMessage(messageType, senderId) {
    console.log(`[P${this.id}] 📨 Recebeu ${messageType} de P${senderId}`);

    switch (messageType) {
      case 'ELECTION':
        this.handleElectionMessage(senderId);
        break;
      case 'OK':
        this.handleOkMessage(senderId);
        break;
      case 'COORDINATOR':
        this.handleCoordinatorMessage(senderId);
        break;
      case 'ALIVE_CHECK':
        this.handleAliveCheck(senderId);
        break;
    }
  }

  handleElectionMessage(senderId) {
    const higherProcesses = this.allProcesses.filter(id => id > this.id);

    // Responde com OK
    console.log(`[P${this.id}] 📤 Enviando OK para P${senderId}`);
    this.sendMessage('OK', senderId);

    // Se não está em eleição, inicia sua própria eleição
    if (!this.inElection && higherProcesses.length > 0) {
      console.log(`[P${this.id}] 🔄 Iniciando eleição própria`);
      this.initiateElection();
    }
  }

  handleOkMessage(senderId) {
    console.log(`[P${this.id}] ✋ Recebeu OK! P${senderId} está concorrendo`);
    this.receivedOk = true;
  }

  handleCoordinatorMessage(senderId) {
    console.log(`[P${this.id}] 👑 NOVO COORDENADOR ELEITO: P${senderId}`);
    this.coordinator = senderId;
    this.state = 'normal';
    this.inElection = false;
  }

  handleAliveCheck(senderId) {
    if (this.state !== 'failed') {
      console.log(`[P${this.id}] 💓 Respondendo ao heartbeat de P${senderId}`);
      this.sendMessage('ALIVE_ACK', senderId);
    }
  }

  // ========================================
  // MÉTODO: TORNAR-SE COORDENADOR
  // ========================================
  becomeCoordinator() {
    console.log(`\n[P${this.id}] 👑 ELEITO COMO NOVO COORDENADOR!`);
    this.coordinator = this.id;
    this.state = 'normal';
    this.inElection = false;

    // Avisa todos os outros processos
    const otherProcesses = this.allProcesses.filter(id => id !== this.id);
    otherProcesses.forEach(processId => {
      this.sendMessage('COORDINATOR', processId);
    });
  }

  // ========================================
  // MÉTODO: ENVIAR MENSAGEM (simulado)
  // ========================================
  sendMessage(messageType, targetId) {
    this.emit('message', {
      from: this.id,
      to: targetId,
      type: messageType,
      timestamp: new Date().toISOString()
    });
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
    
    // Se foi o coordenador e recuperou, continua sendo
    if (this.coordinator === this.id) {
      console.log(`[P${this.id}] Continua como coordenador`);
    } else {
      // Senão, inicia eleição para descobrir novo coordenador
      this.initiateElection();
    }
  }

  // ========================================
  // MÉTODO: VERIFICAR COORDENADOR (heartbeat)
  // ========================================
  checkCoordinator() {
    if (this.coordinator === null || this.coordinator === undefined) {
      console.log(`[P${this.id}] ⚠️  Coordenador desconhecido! Iniciando eleição`);
      this.initiateElection();
    } else {
      this.sendMessage('ALIVE_CHECK', this.coordinator);
    }
  }

  getStatus() {
    return {
      processId: this.id,
      coordinator: this.coordinator,
      state: this.state,
      inElection: this.inElection
    };
  }
}

// ========================================
// SIMULAÇÃO DO SISTEMA
// ========================================

class BullyElectionSystem {
  constructor(processIds) {
    this.processes = new Map();
    this.messageLog = [];

    // Cria processos
    processIds.forEach(id => {
      this.processes.set(id, new Process(id, processIds));
      
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
      targetProcess.receiveMessage(msg.type, msg.from);
    }
  }

  simulateCoordinatorFailure(targetId) {
    const process = this.processes.get(targetId);
    if (process) {
      process.fail();
      
      // Outros processos detectam falha e iniciam eleição
      setTimeout(() => {
        const survivor = Array.from(this.processes.values()).find(
          p => p.state !== 'failed' && p.id !== targetId && p.id === Math.max(...Array.from(this.processes.values()).filter(x => x.state !== 'failed').map(x => x.id))
        );
        
        if (survivor) {
          survivor.initiateElection();
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
      console.log(`${icon} P${status.processId}: Coordenador=P${status.coordinator}, Estado=${status.state}`);
    });
  }
}

// ========================================
// EXEMPLO DE EXECUÇÃO
// ========================================

console.log(`

📊 FLUXO DO ALGORITMO BULLY:

CENÁRIO 1: Falha do Coordenador
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Inicial: P5 é coordenador (ID maior)
         P5 → P3 → P1 (IDs)

Passo 1: P5 FALHA
         └─ P3 e P1 detectam falha

Passo 2: P3 inicia eleição
         └─ Envia ELECTION para P5 (falho)
         └─ P5 não responde

Passo 3: P3 não recebeu OK
         └─ Se torna novo COORDENADOR
         └─ Avisa P1 e P5: "Sou o novo coordenador"

Resultado: P3 é novo coordenador

═══════════════════════════════════════════════════════════════

COMPLEXIDADE:
• Melhor caso: O(n) mensagens
• Pior caso: O(n²) mensagens
• Tempo: O(n) rodadas

═══════════════════════════════════════════════════════════════

✅ VANTAGENS:

✓ Simples de implementar
✓ Detecta automaticamente falhas
✓ Elegante na solução

❌ DESVANTAGENS:

✗ Alto número de mensagens
✗ Problema com processos bissextos
✗ Não escalável para muitos processos

═══════════════════════════════════════════════════════════════
`);

module.exports = { Process, BullyElectionSystem };

console.log('\n✓ Módulo Algoritmo Bully carregado com sucesso!');
