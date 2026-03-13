const http = require('http');
const readline = require('readline');

const API_URL = 'http://localhost:3002';

// Interface para input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

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

async function listarCategorias() {
    try {
        const res = await makeRequest('GET', '/api/categorias');
        if (res.data.sucesso) {
            return res.data.dados || [];
        }
        return [];
    } catch (err) {
        console.error('\x1b[31m✗ Erro ao listar categorias\x1b[0m');
        return [];
    }
}

async function cadastrarCategoria() {
    console.log('\n\x1b[33m═══════════════════════════════════════\x1b[0m');
    console.log('\x1b[33m   CADASTRAR NOVA CATEGORIA\x1b[0m');
    console.log('\x1b[33m═══════════════════════════════════════\x1b[0m\n');

    const nome = await question('\x1b[36m[?] Nome da categoria: \x1b[0m');

    if (!nome.trim()) {
        console.log('\x1b[31m✗ Nome não pode estar vazio!\x1b[0m\n');
        return;
    }

    try {
        const res = await makeRequest('POST', '/api/categorias', { nome: nome.trim() });
        
        if (res.status === 201 || res.status === 200) {
            console.log('\n\x1b[32m✓ Categoria criada com sucesso!\x1b[0m');
            console.log(`   ID: ${res.data.dados?._id || res.data._id}`);
            console.log(`   Nome: ${res.data.dados?.nome || res.data.nome}\n`);
        } else {
            console.log(`\x1b[31m✗ Erro ao criar categoria (${res.status})\x1b[0m\n`);
        }
    } catch (err) {
        console.log(`\x1b[31m✗ Erro: ${err.message}\x1b[0m\n`);
    }
}

async function cadastrarProduto() {
    console.log('\n\x1b[33m═══════════════════════════════════════\x1b[0m');
    console.log('\x1b[33m    CADASTRAR NOVO PRODUTO\x1b[0m');
    console.log('\x1b[33m═══════════════════════════════════════\x1b[0m\n');

    // Listar categorias
    console.log('\x1b[36m[*] Carregando categorias...\x1b[0m\n');
    const categorias = await listarCategorias();

    if (categorias.length === 0) {
        console.log('\x1b[31m✗ Nenhuma categoria disponível. Crie uma primeira!\x1b[0m\n');
        return;
    }

    // Mostrar opções
    console.log('\x1b[33mCategorias disponíveis:\x1b[0m');
    categorias.forEach((c, idx) => {
        console.log(`   ${idx + 1}. ${c.nome} (${c._id})`);
    });
    console.log();

    const nome = await question('\x1b[36m[?] Nome do produto: \x1b[0m');
    if (!nome.trim()) {
        console.log('\x1b[31m✗ Nome não pode estar vazio!\x1b[0m\n');
        return;
    }

    const descricao = await question('\x1b[36m[?] Descrição: \x1b[0m');
    
    const precoStr = await question('\x1b[36m[?] Preço (ex: 29.99): \x1b[0m');
    const preco = parseFloat(precoStr);
    if (isNaN(preco) || preco <= 0) {
        console.log('\x1b[31m✗ Preço inválido!\x1b[0m\n');
        return;
    }

    const categoriaIdx = await question(`\x1b[36m[?] Número da categoria (1-${categorias.length}): \x1b[0m`);
    const idx = parseInt(categoriaIdx) - 1;
    
    if (idx < 0 || idx >= categorias.length) {
        console.log('\x1b[31m✗ Categoria inválida!\x1b[0m\n');
        return;
    }

    const categoriaId = categorias[idx]._id;

    try {
        const novoProduto = {
            nome: nome.trim(),
            descricao: descricao.trim() || undefined,
            preco: preco,
            categoriaId: categoriaId
        };

        const res = await makeRequest('POST', '/api/produtos', novoProduto);
        
        if (res.status === 201 || res.status === 200) {
            console.log('\n\x1b[32m✓ Produto criado com sucesso!\x1b[0m');
            console.log(`   ID: ${res.data.dados?._id || res.data._id}`);
            console.log(`   Nome: ${res.data.dados?.nome || res.data.nome}`);
            console.log(`   Preço: R$ ${preco.toFixed(2)}`);
            console.log(`   Categoria: ${categorias[idx].nome}\n`);
        } else {
            console.log(`\x1b[31m✗ Erro ao criar produto (${res.status})\x1b[0m`);
            console.log(`Resposta: ${JSON.stringify(res.data)}\n`);
        }
    } catch (err) {
        console.log(`\x1b[31m✗ Erro: ${err.message}\x1b[0m\n`);
    }
}

async function main() {
    console.log('\n\x1b[36m═══════════════════════════════════════\x1b[0m');
    console.log('\x1b[36m     CADASTRAR DADOS - PRODUTOS\x1b[0m');
    console.log('\x1b[36m═══════════════════════════════════════\x1b[0m\n');
    
    console.log('\x1b[33mOpções:\x1b[0m');
    console.log('   1. Cadastrar Categoria');
    console.log('   2. Cadastrar Produto');
    console.log('   3. Sair\n');

    let continuar = true;

    while (continuar) {
        const opcao = await question('\x1b[36m[?] Digite sua opção (1-3): \x1b[0m');

        switch (opcao.trim()) {
            case '1':
                await cadastrarCategoria();
                break;
            case '2':
                await cadastrarProduto();
                break;
            case '3':
                continuar = false;
                console.log('\n\x1b[32m✓ Até logo!\x1b[0m\n');
                break;
            default:
                console.log('\x1b[31m✗ Opção inválida!\x1b[0m\n');
        }
    }

    rl.close();
}

main().catch(err => {
    console.error(`\x1b[31m✗ Erro: ${err.message}\x1b[0m`);
    rl.close();
    process.exit(1);
});
