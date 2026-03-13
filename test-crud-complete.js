const http = require('http');

const API_URL = 'http://localhost:3002';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function makeRequest(method, path, body = null, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error(`Timeout após ${timeout}ms`));
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runFullCRUDTest() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}   TESTE CRUD COMPLETO - PRODUTOS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    let passed = 0;
    let failed = 0;
    let produtoTestId = null;

    // 1. CREATE - Cadastrar novo produto
    console.log(`${colors.blue}[TEST 1]${colors.reset} CREATE - Cadastrar novo produto`);
    try {
        const novoProduto = {
            nome: 'Produto CRUD Test - ' + new Date().getTime(),
            descricao: 'Produto para testes de CRUD',
            preco: 99.99,
            categoriaId: '69ab68b032e6a7c6fb05f4c1'
        };

        const res = await makeRequest('POST', '/api/produtos', novoProduto);
        
        if ((res.status === 201 || res.status === 200) && res.data.dados) {
            produtoTestId = res.data.dados._id;
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Produto criado`);
            console.log(`   ID: ${produtoTestId}`);
            console.log(`   Nome: ${res.data.dados.nome}\n`);
            passed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    if (!produtoTestId) {
        console.log(`${colors.red}Não foi possível continuar sem um produto válido\n${colors.reset}`);
        process.exit(1);
    }

    // 2. READ - Obter produto por ID
    console.log(`${colors.blue}[TEST 2]${colors.reset} READ - Obter produto por ID`);
    try {
        const res = await makeRequest('GET', `/api/produtos/${produtoTestId}`);
        
        if (res.status === 200 && res.data.dados) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Produto encontrado`);
            console.log(`   Nome: ${res.data.dados.nome}`);
            console.log(`   Preço: R$ ${res.data.dados.preco}\n`);
            passed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    // 3. UPDATE - Atualizar produto
    console.log(`${colors.blue}[TEST 3]${colors.reset} UPDATE - Atualizar produto`);
    try {
        const atualizacao = {
            nome: 'Produto CRUD Test - Atualizado',
            preco: 149.99
        };

        const res = await makeRequest('PUT', `/api/produtos/${produtoTestId}`, atualizacao);
        
        if ((res.status === 200 || res.status === 204) && (res.data.dados || res.status === 204)) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Produto atualizado`);
            if (res.data.dados) {
                console.log(`   Nome: ${res.data.dados.nome}`);
                console.log(`   Preço: R$ ${res.data.dados.preco}\n`);
            } else {
                console.log(`   Status 204 - Sem conteúdo\n`);
            }
            passed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    // 4. READ após UPDATE - Verificar se atualização foi aplicada
    console.log(`${colors.blue}[TEST 4]${colors.reset} READ (pós-UPDATE) - Verificar atualização`);
    try {
        const res = await makeRequest('GET', `/api/produtos/${produtoTestId}`);
        
        if (res.status === 200 && res.data.dados && res.data.dados.preco === 149.99) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Atualização confirmada`);
            console.log(`   Nome: ${res.data.dados.nome}`);
            console.log(`   Preço: R$ ${res.data.dados.preco}\n`);
            passed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Atualização não foi aplicada\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    // 5. DELETE - Deletar produto
    console.log(`${colors.blue}[TEST 5]${colors.reset} DELETE - Deletar produto`);
    try {
        const res = await makeRequest('DELETE', `/api/produtos/${produtoTestId}`);
        
        if (res.status === 200 || res.status === 204) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Produto deletado\n`);
            passed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    // 6. READ pós DELETE - Verificar se foi deletado
    console.log(`${colors.blue}[TEST 6]${colors.reset} READ (pós-DELETE) - Verificar exclusão`);
    try {
        const res = await makeRequest('GET', `/api/produtos/${produtoTestId}`);
        
        if (res.status === 404) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Produto não encontrado (deletado com sucesso)\n`);
            passed++;
        } else if (res.status === 200) {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Produto ainda existe\n`);
            failed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status inesperado: ${res.status}\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    // Resumo
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}RESUMO DOS TESTES CRUD${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✓ Passaram: ${passed}${colors.reset}`);
    console.log(`${colors.red}✗ Falharam: ${failed}${colors.reset}`);
    console.log(`Total: ${passed + failed}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

runFullCRUDTest().catch(err => {
    console.error(`${colors.red}Erro fatal:${colors.reset}`, err);
    process.exit(1);
});
