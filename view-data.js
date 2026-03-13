const http = require('http');

const API_URL = 'http://localhost:3002';

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

async function viewData() {
    console.log('\n\x1b[36m═════════════════════════════════════════\x1b[0m');
    console.log('\x1b[36m        VISUALIZAR DADOS - BANCO DE DADOS\x1b[0m');
    console.log('\x1b[36m═════════════════════════════════════════\x1b[0m\n');

    try {
        // Buscar produtos
        console.log('\x1b[33m[PRODUTOS]\x1b[0m');
        const produtosRes = await makeRequest('GET', '/api/produtos?limite=100');
        
        if (produtosRes.data.sucesso && produtosRes.data.dados) {
            console.log(`Total: ${produtosRes.data.quantidade} produtos\n`);
            
            produtosRes.data.dados.forEach((p, idx) => {
                const categoriaNome = typeof p.categoriaId === 'object' ? p.categoriaId.nome : p.categoriaId;
                console.log(`${idx + 1}. ${p.nome}`);
                console.log(`   ID: ${p._id}`);
                console.log(`   Descrição: ${p.descricao || 'N/A'}`);
                console.log(`   Preço: R$ ${p.preco}`);
                console.log(`   Categoria: ${categoriaNome || 'N/A'}`);
                console.log(`   Criado: ${new Date(p.createdAt).toLocaleString('pt-BR')}`);
                console.log('');
            });
        }

        // Buscar categorias
        console.log('\x1b[33m[CATEGORIAS]\x1b[0m');
        const categoriasRes = await makeRequest('GET', '/api/categorias');
        
        if (categoriasRes.data.sucesso && categoriasRes.data.dados) {
            console.log(`Total: ${categoriasRes.data.quantidade} categorias\n`);
            
            categoriasRes.data.dados.forEach((c, idx) => {
                console.log(`${idx + 1}. ${c.nome}`);
                console.log(`   ID: ${c._id}`);
                console.log(`   Criado: ${new Date(c.createdAt).toLocaleString('pt-BR')}`);
                console.log('');
            });
        }

        // Resumo
        console.log('\x1b[36m═════════════════════════════════════════\x1b[0m');
        console.log('\x1b[32m✓ Dados carregados com sucesso!\x1b[0m');
        console.log('\x1b[36m═════════════════════════════════════════\x1b[0m\n');

    } catch (err) {
        console.error(`\x1b[31m✗ Erro: ${err.message}\x1b[0m\n`);
        process.exit(1);
    }
}

viewData();
