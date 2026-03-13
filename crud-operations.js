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

async function listarProdutos() {
    try {
        const res = await makeRequest('GET', '/api/produtos?limite=100');
        if (res.data.sucesso) {
            return res.data.dados || [];
        }
        return [];
    } catch (err) {
        console.error('\x1b[31m✗ Erro ao listar produtos\x1b[0m');
        return [];
    }
}

async function atualizarProduto() {
    console.log('\n\x1b[33m═══════════════════════════════════════\x1b[0m');
    console.log('\x1b[33m     ATUALIZAR PRODUTO\x1b[0m');
    console.log('\x1b[33m═══════════════════════════════════════\x1b[0m\n');

    // Listar produtos
    console.log('\x1b[36m[*] Carregando produtos...\x1b[0m\n');
    const produtos = await listarProdutos();

    if (produtos.length === 0) {
        console.log('\x1b[31m✗ Nenhum produto disponível!\x1b[0m\n');
        return;
    }

    // Mostrar opções
    console.log('\x1b[33mProdutos disponíveis:\x1b[0m');
    produtos.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.nome} (R$ ${p.preco})`);
    });
    console.log();

    const produtoIdx = await question(`\x1b[36m[?] Número do produto a atualizar (1-${produtos.length}): \x1b[0m`);
    const idx = parseInt(produtoIdx) - 1;
    
    if (idx < 0 || idx >= produtos.length) {
        console.log('\x1b[31m✗ Produto inválido!\x1b[0m\n');
        return;
    }

    const produtoAtual = produtos[idx];
    console.log(`\n\x1b[36m[*] Produto selecionado: ${produtoAtual.nome}\x1b[0m\n`);

    // Campos a atualizar
    console.log('\x1b[33mDeixe em branco para não alterar:\x1b[0m\n');
    
    const novoNome = await question(`\x1b[36m[?] Novo nome (${produtoAtual.nome}): \x1b[0m`);
    const novaDescricao = await question(`\x1b[36m[?] Nova descrição (${produtoAtual.descricao || '-'}): \x1b[0m`);
    const novoPrecoStr = await question(`\x1b[36m[?] Novo preço (${produtoAtual.preco}): \x1b[0m`);

    try {
        const atualizacao = {};
        
        if (novoNome.trim()) {
            atualizacao.nome = novoNome.trim();
        }
        
        if (novaDescricao.trim()) {
            atualizacao.descricao = novaDescricao.trim();
        }
        
        if (novoPrecoStr.trim()) {
            const novoPreco = parseFloat(novoPrecoStr);
            if (isNaN(novoPreco) || novoPreco <= 0) {
                console.log('\x1b[31m✗ Preço inválido!\x1b[0m\n');
                return;
            }
            atualizacao.preco = novoPreco;
        }

        if (Object.keys(atualizacao).length === 0) {
            console.log('\x1b[31m✗ Nenhum campo foi alterado!\x1b[0m\n');
            return;
        }

        const res = await makeRequest('PUT', `/api/produtos/${produtoAtual._id}`, atualizacao);
        
        if (res.status === 200 || res.status === 204) {
            console.log('\n\x1b[32m✓ Produto atualizado com sucesso!\x1b[0m');
            
            if (res.data.dados) {
                console.log(`   Nome: ${res.data.dados.nome}`);
                console.log(`   Descrição: ${res.data.dados.descricao || '-'}`);
                console.log(`   Preço: R$ ${res.data.dados.preco.toFixed(2)}\n`);
            } else {
                console.log(`   ID: ${produtoAtual._id}\n`);
            }
        } else {
            console.log(`\x1b[31m✗ Erro ao atualizar produto (${res.status})\x1b[0m`);
            console.log(`Resposta: ${JSON.stringify(res.data)}\n`);
        }
    } catch (err) {
        console.log(`\x1b[31m✗ Erro: ${err.message}\x1b[0m\n`);
    }
}

async function deletarProduto() {
    console.log('\n\x1b[33m═══════════════════════════════════════\x1b[0m');
    console.log('\x1b[31m     DELETAR PRODUTO\x1b[0m');
    console.log('\x1b[33m═══════════════════════════════════════\x1b[0m\n');

    // Listar produtos
    console.log('\x1b[36m[*] Carregando produtos...\x1b[0m\n');
    const produtos = await listarProdutos();

    if (produtos.length === 0) {
        console.log('\x1b[31m✗ Nenhum produto disponível!\x1b[0m\n');
        return;
    }

    // Mostrar opções
    console.log('\x1b[33mProdutos disponíveis:\x1b[0m');
    produtos.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.nome} (R$ ${p.preco})`);
    });
    console.log();

    const produtoIdx = await question(`\x1b[36m[?] Número do produto a deletar (1-${produtos.length}): \x1b[0m`);
    const idx = parseInt(produtoIdx) - 1;
    
    if (idx < 0 || idx >= produtos.length) {
        console.log('\x1b[31m✗ Produto inválido!\x1b[0m\n');
        return;
    }

    const produtoAtual = produtos[idx];
    
    // Confirmação
    console.log(`\n\x1b[31m[!] AVISO: Você está prestes a deletar "${produtoAtual.nome}"\x1b[0m`);
    const confirmacao = await question('\x1b[36m[?] Tem certeza? (s/n): \x1b[0m');
    
    if (confirmacao.toLowerCase() !== 's' && confirmacao.toLowerCase() !== 'sim') {
        console.log('\x1b[33m[*] Operação cancelada.\x1b[0m\n');
        return;
    }

    try {
        const res = await makeRequest('DELETE', `/api/produtos/${produtoAtual._id}`);
        
        if (res.status === 200 || res.status === 204) {
            console.log('\n\x1b[32m✓ Produto deletado com sucesso!\x1b[0m');
            console.log(`   Deletado: ${produtoAtual.nome}\n`);
        } else {
            console.log(`\x1b[31m✗ Erro ao deletar produto (${res.status})\x1b[0m`);
            console.log(`Resposta: ${JSON.stringify(res.data)}\n`);
        }
    } catch (err) {
        console.log(`\x1b[31m✗ Erro: ${err.message}\x1b[0m\n`);
    }
}

async function main() {
    console.log('\n\x1b[36m═══════════════════════════════════════\x1b[0m');
    console.log('\x1b[36m   OPERAÇÕES CRUD - PRODUTOS\x1b[0m');
    console.log('\x1b[36m═══════════════════════════════════════\x1b[0m\n');
    
    console.log('\x1b[33mOpções:\x1b[0m');
    console.log('   1. Atualizar Produto');
    console.log('   2. Deletar Produto');
    console.log('   3. Sair\n');

    let continuar = true;

    while (continuar) {
        const opcao = await question('\x1b[36m[?] Digite sua opção (1-3): \x1b[0m');

        switch (opcao.trim()) {
            case '1':
                await atualizarProduto();
                break;
            case '2':
                await deletarProduto();
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
