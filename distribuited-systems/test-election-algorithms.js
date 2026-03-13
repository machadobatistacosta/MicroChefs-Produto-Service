/**
 * DEMONSTRAÇÃO DOS ALGORITMOS DE ELEIÇÃO
 * Teste prático dos algoritmos Bully e Ring
 */

const { BullyElectionSystem } = require('./bully-algorithm');
const { RingElectionSystem } = require('./ring-algorithm');

console.log(`
╔═════════════════════════════════════════════════════════════════╗
║          DEMONSTRAÇÃO - ALGORITMOS DE ELEIÇÃO DISTRIBUÍDA      ║
║                                                                 ║
║  Teste: Falha do Coordenador e Reeleição                       ║
╚═════════════════════════════════════════════════════════════════╝
`);

// ========================================
// TESTE 1: ALGORITMO BULLY
// ========================================

console.log(`

${'═'.repeat(70)}
TEST 1: ALGORITMO BULLY
${'═'.repeat(70)}

Cenário: 4 processos (P1, P3, P5, P7)
Coordenador inicial: P7 (maior ID)
Falha: P7 cai

`);

const bullySystem = new BullyElectionSystem([1, 3, 5, 7]);

console.log('\n📍 STATUS INICIAL:');
bullySystem.printStatus();

console.log('\n⏳ Aguardando 2 segundos...');
setTimeout(() => {
  console.log('\n⚡ SIMULANDO FALHA DE P7 (COORDENADOR)');
  bullySystem.simulateCoordinatorFailure(7);

  setTimeout(() => {
    console.log('\n\n📍 STATUS APÓS FALHA:');
    bullySystem.printStatus();

    console.log('\n✅ RESULTADO ESPERADO:');
    console.log('   - P5 inicia eleição');
    console.log('   - P5 envia ELECTION para P7');
    console.log('   - P7 está falho, sem resposta');
    console.log('   - P5 se torna novo coordenador');
    console.log('   - Avisa P1, P3, P7: "Sou o novo coordenador"');

    // ========================================
    // TESTE 2: ALGORITMO RING
    // ========================================

    console.log(`\n\n${'═'.repeat(70)}`);
    console.log('TEST 2: ALGORITMO RING');
    console.log(`${'═'.repeat(70)}`);

    console.log(`

Cenário: 4 processos em ANEL (P1 → P3 → P5 → P7 → P1)
Coordenador inicial: P7 (maior ID)
Falha: P7 cai

`);

    const ringSystem = new RingElectionSystem([1, 3, 5, 7]);

    console.log('\n📍 TOPOLOGIA INICIAL:');
    ringSystem.printTopology();

    console.log('\n📍 STATUS INICIAL:');
    ringSystem.printStatus();

    console.log('\n⏳ Aguardando 2 segundos...');
    setTimeout(() => {
      console.log('\n⚡ SIMULANDO FALHA DE P7 (COORDENADOR)');
      ringSystem.simulateCoordinatorFailure(7);

      setTimeout(() => {
        console.log('\n\n📍 TOPOLOGIA APÓS FALHA:');
        ringSystem.printTopology();

        console.log('\n📍 STATUS APÓS FALHA:');
        ringSystem.printStatus();

        console.log('\n✅ RESULTADO ESPERADO:');
        console.log('   - P1 (próximo de P7) detecta falha');
        console.log('   - P1 inicia eleição, cria token: [1]');
        console.log('   - P1 → P3: ELECTION [1]');
        console.log('   - P3 adiciona ao token: [1, 3]');
        console.log('   - P3 → P5: ELECTION [1, 3]');
        console.log('   - P5 adiciona ao token: [1, 3, 5]');
        console.log('   - P5 → P7: ELECTION [1, 3, 5]');
        console.log('   - P7 está falho, mensagem não entrega');
        console.log('   - P1 recebe seu próprio token de volta');
        console.log('   - Maior ID no token = 5');
        console.log('   - P5 é eleito novo coordenador!');

        // ========================================
        // RESUMO COMPARATIVO
        // ========================================

        console.log(`\n\n${'═'.repeat(70)}`);
        console.log('RESUMO COMPARATIVO');
        console.log(`${'═'.repeat(70)}`);

        console.log(`

┌──────────────────────┬────────────────┬────────────────┐
│ CARACTERÍSTICA       │ ALGORITMO BULLY│ ALGORITMO RING │
├──────────────────────┼────────────────┼────────────────┤
│ Topologia Requerida  │ Qualquer       │ Circular       │
│ Complet. no Pior     │ O(n²)          │ O(n²)          │
│ Detecção de Falha    │ Rápida         │ Lenta          │
│ Número de Mensagens  │ Variável       │ Constante      │
│ Implementação        │ Simples        │ Média          │
│ Uso de Heartbeat     │ Não            │ Sim            │
└──────────────────────┴────────────────┴────────────────┘

CASOS DE USO:

BULLY é melhor quando:
  ✓ Sistema é pequeno (< 20 processos)
  ✓ Falhas são frequentes
  ✓ Requer detecção rápida
  ✓ Topologia é dinâmica

RING é melhor quando:
  ✓ Processos estão em topologia circular
  ✓ System é grande
  ✓ Usar heartbeat é aceitável
  ✓ Processadores têm poder limitado

═══════════════════════════════════════════════════════════════

OUTRAS ALGORITMOS DE ELEIÇÃO:

1. **ACHD (Auletta, Cunto, Hanani, Diaz)**
   └─ Melhoramento do Bully
   └─ Reduz mensagens

2. **GARCIA-MOLINA**
   └─ Baseado em timestamps
   └─ Bom para redes complexas

3. **HIRSCHBERG-SINCLAIR**
   └─ Basado em Ring
   └─ Reduz mensagens a O(n log n)

4. **KORACH-KUTTEN-MORAN**
   └─ Ótimo para grafos gerais
   └─ O(n log n) mensagens

═══════════════════════════════════════════════════════════════
`);

        // Simulação de recuperação
        console.log('\n\n⏳ Aguardando 2 segundos para simular recuperação...');
        setTimeout(() => {
          console.log('\n✅ [P7] SE RECUPERANDO');
          ringSystem.recoverProcess(7);
          
          console.log('\n📍 STATUS APÓS RECUPERAÇÃO:');
          ringSystem.printStatus();

          console.log(`\n${'═'.repeat(70)}`);
          console.log('✅ DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!');
          console.log(`${'═'.repeat(70)}`);

          console.log(`\n📚 PRÓXIMOS PASSOS:

1. Estude a implementação detalhada de cada algoritmo
2. Execute testes com diferentes configurações
3. Meça performance em cenários reais
4. Implemente em seu trabalho de classe

💡 REFERÊNCIAS:

• Distributed Systems: Concept and Design
  └─ Coulouris, Dollimore, Kindberg
  
• Introduction to Distributed Algorithms
  └─ Gerard Tel
  
• Distributed Computing: Fundamentals, Simulaton, Advanced Topics
  └─ Barboianu

`);

          process.exit(0);
        }, 2000);

      }, 3000);

    }, 2000);

  }, 3000);

}, 2000);

// Timeout geral
setTimeout(() => {
  console.error('\n❌ Timeout na execução');
  process.exit(1);
}, 30000);
