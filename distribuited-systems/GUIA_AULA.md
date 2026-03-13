# 🏫 Sistemas Distribuídos - Guia Completo para Aula

## 📌 Tópicos Implementados

### 1️⃣ **gRPC** - Comunicação RPC de Alta Performance
**Arquivo:** `grpc-example.js`

```bash
node grpc-example.js
```

#### Características:
- ✓ Protocol Buffers para serialização
- ✓ HTTP/2 com multiplexing
- ✓ Suporta 4 tipos de RPC
- ✓ Code generation automático
- ✓ Linguagem agnóstica

#### Vantagens:
- 🟢 Performance muito alta
- 🟢 Suporte a streaming bidirecionional
- 🟢 Compatível com múltiplas linguagens

#### Desvantagens:
- 🔴 Mensagens não legíveis (binárias)
- 🔴 Curva de aprendizado
- 🔴 Suporte limitado em browsers

---

### 2️⃣ **RPC com Socket.io** - Chamadas Remotas em Tempo Real
**Arquivo:** `rpc-socket-example.js`

```bash
node rpc-socket-example.js
```

#### Características:
- ✓ Comunicação bidirecional WebSocket
- ✓ Fallback automático (Long-polling)
- ✓ Callbacks de requisição/resposta
- ✓ Timeout automático
- ✓ Mensagens JSON legíveis

#### Vantagens:
- 🟢 Fácil implementação
- 🟢 Debugging simples
- 🟢 Tempo real com callbacks

#### Desvantagens:
- 🔴 Menor performance que gRPC
- 🔴 Sem type safety
- 🔴 Escalabilidade limitada

---

### 3️⃣ **Algoritmo Bully** - Eleição de Líder
**Arquivo:** `bully-algorithm.js`

```bash
node bully-algorithm.js
```

#### Como Funciona:
1. Processo detecta falha do coordenador
2. Inicia eleição enviando ELECTION
3. Processos com ID maior respondem com OK
4. Se ninguém responde, vira coordenador
5. Novo coordenador avisa todos

#### ComplexidadeComplexidade:
- Melhor caso: O(n)
- Pior caso: O(n²)

#### Ideal Para:
- ✓ Sistemas pequenos
- ✓ Falhas frequentes
- ✓ Requer detecção rápida

---

### 4️⃣ **Algoritmo Ring** - Eleição em Topologia Circular
**Arquivo:** `ring-algorithm.js`

```bash
node ring-algorithm.js
```

#### Como Funciona:
1. Processos organizados em anel: P1 → P2 → ... → Pn → P1
2. Eleição passa de processo a processo
3. Cada um adiciona seu ID ao token
4. Quando volta ao originador, maior ID vence
5. Novo coordenador é anunciado

#### Complexidade:
- Sempre O(n²)
- Número de mensagens é constante

#### Ideal Para:
- ✓ Topologia circular estabelecida
- ✓ Sistemas grandes
- ✓ Heartbeat aceitável

---

## 🧪 Executar Testes

### Teste Completo de Eleição
```bash
node test-election-algorithms.js
```

Mostra:
- Simulação do Algoritmo Bully
- Simulação do Algoritmo Ring
- Falha do coordenador
- Reeleição automática
- Recuperação de processos

---

## 📊 Comparação dos Algoritmos

| Aspecto | gRPC | RPC Socket | Bully | Ring |
|---------|------|-----------|-------|------|
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Facilidade** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Tempo Real** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Escalabilidade** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Type Safe** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐ |

---

## 🔍 Detalhes Técnicos

### gRPC
```protobuf
service ProdutoService {
  rpc ListarProdutos (google.protobuf.Empty) 
    returns (ListaProdutosResponse);
  
  rpc StreamProdutos (google.protobuf.Empty) 
    returns (stream Produto);
}
```

### RPC Socket
```javascript
const client = new RPCClient(socket);
const resultado = await client.call('produto:listar');
```

### Bully Election
```
P5 detecta falha de P7
↓
P5 envia ELECTION para P6, P7
↓
P6 responde OK
↓
P5 desiste (há competidor maior)
↓
P6 envia ELECTION para P7
↓
S7 está falho
↓
P6 se torna coordenador
↓
P6 avisa: COORDINATOR
```

### Ring Election
```
Token passa: P1 → P3 → P5 → P7 → P1
P7 está falho
↓
Token contém: [1, 3, 5]
↓
Maior ID = 5
↓
P5 é eleito
```

---

## 📚 Recursos Adicionais

### Livros Recomendados
1. **Distributed Systems: Concept and Design**
   - Coulouris, Dollimore, Kindberg
   - Capítulo 12: Coordination and Agreement

2. **Introduction to Distributed Algorithms**
   - Gerard Tel
   - Capítulo 4: Election Algorithms

3. **Distributed Computing: Fundamentals, Simulation, Advanced Topics**
   - Ghosh

### Papers Importantes
- "Bully Algorithm" (Chang & Roberts, 1979)
- "A Ring Algorithm for Leader Election"
- "ACHD: Efficient Leader Election in Distributed Systems"

---

## 🎓 Atividades para Aula

### Atividade 1: Comparar Algoritmos
Modifique os arquivos para:
- Contar número de mensagens
- Medir tempo de eleição
- Logs detalhados de cada etapa

### Atividade 2: Implementar Variações
- Adicione detecção de falsos positivos
- Implemente heartbeat periódico
- Adicione timeouts dinâmicos

### Atividade 3: Analisar Performance
- Teste com 10, 20, 50, 100 processos
- Meça latência em diferentes cenários
- Crie gráficos de performance

### Atividade 4: Integração com API
- Integre eleição de líder com API de produtos
- Uma instância da API roda como coordenador
- Quando cai, outra assume

---

## 🚀 Próximos Passos

1. **Implementar Heartbeat**
   - Coordenador envia ping periódico
   - Processo que não responde é considerado falho

2. **Adicionar Persistência**
   - Salvar estado em disco
   - Recuperação rápida após crash

3. **Clustering**
   - Múltiplas instâncias da API
   - Replicação de dados
   - Failover automático

4. **Monitoramento**
   - Dashboard em tempo real
   - Alertas de falhas
   - Métricas de performance

---

## 💡 Dicas para Apresentação

### Slide 1: Introdução
- Definição de sistemas distribuídos
- Importância de eleição de líder
- Casos de uso reais

### Slide 2: Conceitos
- RPC vs REST
- Sincronização distribuída
- Falhas e recuperação

### Slide 3: gRPC
- Demonstração live
- Performance vs REST
- Quando usar

### Slide 4: RPC Socket
- Exemplo tempo real
- Fallback automático
- Casos de uso

### Slide 5: Bully
- Animação do fluxo
- Complexidade de mensagens
- Vantagens/Desvantagens

### Slide 6: Ring
- Topologia circular
- Comparação com Bully
- Quando usar cada um

### Slide 7: Conclusão
- Resumo comparativo
- Tecnologias modernas
- Trabalhos futuros

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação Distribuida-systems/
2. Verifique os exemplos em cada arquivo
3. Execute os testes para entender o fluxo
4. Adapte conforme suas necessidades

---

## ✅ Checklist para Apresentação

- [ ] Revisar todos os 4 algoritmos
- [ ] Executar testes
- [ ] Preparar slides
- [ ] Gravar demo de falha/recuperação
- [ ] Documentar códigos adicionais
- [ ] Preparar exemplos em tempo real
- [ ] Testar em diferentes sistemas operacionais
- [ ] Revisar references bibliográficas

---

**Data:** 13 de Março de 2026  
**Sistema:** Microserviço de Produtos + Sistemas Distribuídos  
**Versão:** 1.0.0
