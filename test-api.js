const http = require('http');

const API_URL = 'http://localhost:3002';

// Cores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper para fazer requisições HTTP
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
                    resolve({ status: res.statusCode, data: json, headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
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

// Testes
async function runTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}   TESTES DE INTEGRAÇÃO - API PRODUTOS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    let testsPassed = 0;
    let testsFailed = 0;

    // Teste 1: Health Check
    console.log(`${colors.blue}[TEST 1]${colors.reset} Health Check`);
    try {
        const res = await makeRequest('GET', '/api/health');
        if (res.status === 200 && res.data.status === 'online') {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Servidor online\n`);
            testsPassed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            testsFailed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        testsFailed++;
    }

    // Teste 2: GET Produtos
    console.log(`${colors.blue}[TEST 2]${colors.reset} GET /api/produtos`);
    try {
        const res = await makeRequest('GET', '/api/produtos');
        if (res.status === 200 && res.data.sucesso) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - ${res.data.quantidade} produtos encontrados`);
            if (res.data.dados.length > 0) {
                console.log(`   ID: ${res.data.dados[0]._id}`);
                console.log(`   Nome: ${res.data.dados[0].nome}`);
            }
            console.log();
            testsPassed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            testsFailed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        testsFailed++;
    }

    // Teste 3: GET Categorias
    console.log(`${colors.blue}[TEST 3]${colors.reset} GET /api/categorias`);
    try {
        const res = await makeRequest('GET', '/api/categorias');
        if (res.status === 200 && res.data.sucesso) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - ${res.data.quantidade} categorias encontradas`);
            if (res.data.dados.length > 0) {
                console.log(`   ID: ${res.data.dados[0]._id}`);
                console.log(`   Nome: ${res.data.dados[0].nome}`);
            }
            console.log();
            testsPassed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            testsFailed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        testsFailed++;
    }

    // Teste 4: POST Novo Produto
    console.log(`${colors.blue}[TEST 4]${colors.reset} POST /api/produtos (Criar novo)`);
    const novoProduto = {
        nome: 'Teste API - ' + new Date().getTime(),
        descricao: 'Produto de teste criado automaticamente',
        preco: 29.99,
        categoriaId: '69ab68b032e6a7c6fb05f4c1' // Use a categoria que existe
    };
    try {
        const res = await makeRequest('POST', '/api/produtos', novoProduto);
        if (res.status === 201 || res.status === 200) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Produto criado`);
            console.log(`   ID: ${res.data.dados?._id || res.data._id}`);
            console.log(`   Nome: ${res.data.dados?.nome || res.data.nome}\n`);
            testsPassed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}`);
            console.log(`   Resposta: ${JSON.stringify(res.data)}\n`);
            testsFailed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        testsFailed++;
    }

    // Teste 5: Rota inválida
    console.log(`${colors.blue}[TEST 5]${colors.reset} Rota inválida (erro esperado)`);
    try {
        const res = await makeRequest('GET', '/api/invalido');
        if (res.status === 404) {
            console.log(`${colors.green}✓ PASSOU${colors.reset} - Erro 404 retornado corretamente\n`);
            testsPassed++;
        } else {
            console.log(`${colors.red}✗ FALHOU${colors.reset} - Status: ${res.status}\n`);
            testsFailed++;
        }
    } catch (err) {
        console.log(`${colors.red}✗ ERRO${colors.reset} - ${err.message}\n`);
        testsFailed++;
    }

    // Resumo
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}RESUMO DOS TESTES${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✓ Passaram: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}✗ Falharam: ${testsFailed}${colors.reset}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    process.exit(testsFailed > 0 ? 1 : 0);
}

// Executar testes
runTests().catch(err => {
    console.error(`${colors.red}Erro fatal:${colors.reset}`, err);
    process.exit(1);
});
