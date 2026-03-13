# 🍔 Microserviço de Produtos - Documentação Completa

## ✅ Status do Projeto

**Data:** 13 de Março de 2026  
**Servidor:** ✓ Online (Porta 3002)  
**Banco de Dados:** ✓ MongoDB Atlas Conectado  
**CRUD:** ✓ 100% Funcional (Produtos + Categorias)

---

## 📦 Estrutura do Projeto

```
product-microservice/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── models/
│   └── routes/
├── tests/
├── .env                    # Variáveis de ambiente
├── package.json
└── [SCRIPTS DE TESTE E ADMINISTRAÇÃO]
```

---

## 🧪 Scripts de Teste Disponíveis

### 1️⃣ **test-api.js** - Testes Básicos
```bash
node test-api.js
```
- ✓ Health Check
- ✓ GET /api/produtos
- ✓ GET /api/categorias
- ✓ POST /api/produtos
- ✓ Rota inválida (erro esperado)

**Resultado:** 5/5 testes passando

---

### 2️⃣ **test-crud-complete.js** - Teste CRUD Produtos
```bash
node test-crud-complete.js
```
- ✓ CREATE - Cadastrar novo produto
- ✓ READ - Obter produto por ID
- ✓ UPDATE - Atualizar produto
- ✓ READ (pós-UPDATE) - Verificar atualização
- ✓ DELETE - Deletar produto
- ✓ READ (pós-DELETE) - Verificar exclusão

**Resultado:** 6/6 testes passando

---

### 3️⃣ **test-crud-categorias.js** - Teste CRUD Categorias
```bash
node test-crud-categorias.js
```
- ✓ CREATE - Cadastrar nova categoria
- ✓ READ - Obter categoria por ID
- ✓ UPDATE - Atualizar categoria
- ✓ READ (pós-UPDATE) - Verificar atualização
- ✓ DELETE - Deletar categoria
- ✓ READ (pós-DELETE) - Verificar exclusão

**Resultado:** 6/6 testes passando

---

## 📝 Scripts de Administração

### 4️⃣ **cadastro.js** - Cadastro Interativo
```bash
node cadastro.js
```
**Menu:**
1. Cadastrar Categoria
2. Cadastrar Produto
3. Sair

Permite inserir dados manualmente no banco de dados.

---

### 5️⃣ **crud-operations.js** - Operações Interativas
```bash
node crud-operations.js
```
**Menu:**
1. Atualizar Produto
2. Deletar Produto
3. Sair

Permite editar e remover dados existentes.

---

### 6️⃣ **view-data.js** - Visualizar Dados
```bash
node view-data.js
```
Exibe no terminal:
- Lista completa de produtos
- Lista completa de categorias
- Formatação legível

---

### 7️⃣ **export-data.js** - Exportar JSON
```bash
node export-data.js
```
Cria arquivo `dados-export-[timestamp].json` com:
- Todos os produtos
- Todas as categorias
- Resumo de dados

---

### 8️⃣ **dashboard.js** - Gerar Dashboard HTML
```bash
node dashboard.js
```
Cria `dashboard.html` com:
- Interface visual moderna
- Tabelas de produtos e categorias
- Estatísticas em tempo real
- Estilo profissional

---

## 🔧 Scripts Utilitários

### 9️⃣ **kill-port.ps1** - Liberar Porta
```powershell
.\kill-port.ps1
```
Mata processo Node na porta 3002 e libera para novo servidor.

---

## 📊 Dados Atuais no Banco

- **Produtos:** 3 cadastrados
- **Categorias:** 2 cadastradas
- **Total de Operações CRUD Testadas:** 12 (6 produtos + 6 categorias)

---

## 🛠️ Como Usar

### Iniciar o Servidor
```bash
npm start
```

### Rodar Todos os Testes
```bash
# Teste básico
node test-api.js

# Teste CRUD Produtos
node test-crud-complete.js

# Teste CRUD Categorias
node test-crud-categorias.js
```

### Cadatrar Dados
```bash
# Interativo
node cadastro.js

# Ver dados cadastrados
node view-data.js
```

### Visualizar em HTML
```bash
# Gerar dashboard
node dashboard.js

# Abrir arquivo gerado
start dashboard.html
```

---

## 📡 Endpoints Testados

### Health Check
```
GET /api/health
Status: 200 OK
Response: {"servico":"ms-produtos","status":"online"}
```

### Produtos
```
GET    /api/produtos              - Listar produtos
GET    /api/produtos/:id          - Obter produto específico
POST   /api/produtos              - Criar novo produto
PUT    /api/produtos/:id          - Atualizar produto
DELETE /api/produtos/:id          - Deletar produto
```

### Categorias
```
GET    /api/categorias            - Listar categorias
GET    /api/categorias/:id        - Obter categoria específica
POST   /api/categorias            - Criar nova categoria
PUT    /api/categorias/:id        - Atualizar categoria
DELETE /api/categorias/:id        - Deletar categoria
```

---

## ✨ Funcionalidades Implementadas

- ✅ Conexão com MongoDB Atlas
- ✅ CRUD completo para Produtos
- ✅ CRUD completo para Categorias
- ✅ Tratamento de erros
- ✅ CORS habilitado
- ✅ Validação de dados
- ✅ Testes automatizados
- ✅ Interface visual (Dashboard)
- ✅ Exportação de dados em JSON

---

## 🚀 Próximos Passos

- [ ] Criar microserviço de Pedidos
- [ ] Criar microserviço de Usuários
- [ ] Implementar Docker Compose
- [ ] Adicionar Swagger/OpenAPI
- [ ] Testes E2E integrados
- [ ] CI/CD Pipeline

---

## 📞 Versão

**v1.0.0** - 13/03/2026  
Microserviço de Produtos - Sistema de Restaurante

---

## 💡 Observações

- Todos os scripts requerem o servidor rodando na porta 3002
- MongoDB Atlas precisa estar acessível
- Timeout padrão: 5 segundos por requisição
- Dashboard é atualizado a cada execução do script `dashboard.js`

