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
    console.log(`${colors.cyan}   TESTE CRUD COMPLETO - CATEGORIAS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    let passed = 0;
    let failed = 0;
    let categoriaTestId = null;

    // 1. CREATE - Cadastrar nova categoria
    console.log(`${colors.blue}[TEST 1]${colors.reset} CREATE - Cadastrar nova categoria`);
    try {
        const novaCategoria = {
            nome: 'Categoria CRUD Test - ' + new Date().getTime()
        };

        const res = await makeRequest('POST', '/api/categorias', novaCategoria);
        
        if ((res.status === 201 || res.status === 200) && res.data.dados) {
            categoriaTestId = res.data.dados._id;
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Categoria criada`);
            console.log(`   ID: ${categoriaTestId}`);
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

    if (!categoriaTestId) {
        console.log(`${colors.red}Não foi possível continuar sem uma categoria válida\n${colors.reset}`);
        process.exit(1);
    }

    // 2. READ - Obter categoria por ID
    console.log(`${colors.blue}[TEST 2]${colors.reset} READ - Obter categoria por ID`);
    try {
        const res = await makeRequest('GET', `/api/categorias/${categoriaTestId}`);
        
        if (res.status === 200 && res.data.dados) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Categoria encontrada`);
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

    // 3. UPDATE - Atualizar categoria
    console.log(`${colors.blue}[TEST 3]${colors.reset} UPDATE - Atualizar categoria`);
    try {
        const atualizacao = {
            nome: 'Categoria CRUD Test - Atualizada'
        };

        const res = await makeRequest('PUT', `/api/categorias/${categoriaTestId}`, atualizacao);
        
        if ((res.status === 200 || res.status === 204) && (res.data.dados || res.status === 204)) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Categoria atualizada`);
            if (res.data.dados) {
                console.log(`   Nome: ${res.data.dados.nome}\n`);
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
        const res = await makeRequest('GET', `/api/categorias/${categoriaTestId}`);
        
        if (res.status === 200 && res.data.dados && res.data.dados.nome.includes('Atualizada')) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Atualização confirmada`);
            console.log(`   Nome: ${res.data.dados.nome}\n`);
            passed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Atualização não foi aplicada\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    // 5. DELETE - Deletar categoria
    console.log(`${colors.blue}[TEST 5]${colors.reset} DELETE - Deletar categoria`);
    try {
        const res = await makeRequest('DELETE', `/api/categorias/${categoriaTestId}`);
        
        if (res.status === 200 || res.status === 204) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Categoria deletada\n`);
            passed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            failed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        failed++;
    }

    // 6. READ pós DELETE - Verificar se foi deletada
    console.log(`${colors.blue}[TEST 6]${colors.reset} READ (pós-DELETE) - Verificar exclusão`);
    try {
        const res = await makeRequest('GET', `/api/categorias/${categoriaTestId}`);
        
        if (res.status === 404) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Categoria não encontrada (deletada com sucesso)\n`);
            passed++;
        } else if (res.status === 200) {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Categoria ainda existe\n`);
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
    console.log(`${colors.cyan}RESUMO DOS TESTES CRUD - CATEGORIAS${colors.reset}`);
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
